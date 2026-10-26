"""Remote Nginx-only preview/apply. Never reads or writes application databases."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib,json,os,shutil,socket,subprocess,sys,urllib.parse

assert socket.gethostname() == 'cartera-prod-lts-20261025'
P=Path(__file__).resolve().parent
assert str(P).startswith('/root/cartera-legacy-transition-')
phase=sys.argv[1]
def run(args):return subprocess.run([str(a) for a in args],capture_output=True,check=True,text=True)
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def save(name,obj):
    f=P/name;f.write_text(json.dumps(obj,indent=2)+'\n');os.chmod(f,0o600)
def probe(host,port,path,https=True,expected=302):
    scheme='https' if https else 'http'
    r=subprocess.run(['curl','--silent','--show-error','--max-time','15','--path-as-is','--resolve',host+':'+str(port)+':127.0.0.1','--dump-header','-',scheme+'://'+host+':'+str(port)+path],capture_output=True,check=True)
    headers,body=r.stdout.split(b'\r\n\r\n',1)
    headers=headers.decode('iso-8859-1')
    status=int(headers.splitlines()[0].split()[1]);assert status==expected,(path,status)
    values={k.lower():v.strip() for k,v in (line.split(':',1) for line in headers.splitlines()[1:] if ':' in line)}
    return values,body

CASES={'/':'/dashboard','/login/':'/dashboard','/select/':'/select-store','/liquidar/':'/dashboard/liquidar','/liquidar/pay/':'/dashboard/liquidar','/ventas/create/':'/dashboard/ventas/nueva','/ventas/123/':'/dashboard/ventas/123','/clientes/123/':'/dashboard/clientes/123','/clientes/update/':'/dashboard/clientes','/recaudos/123/':'/dashboard/recaudos','/gastos/create/':'/dashboard/gastos/crear','/register/':'/register','/unknown?next=https://invalid.example&token=not-a-real-token':'/dashboard'}
def check_all(http,tls):
    checks=0
    for host in ['carterafinanciera.com','www.carterafinanciera.com']:
        for secure,port in [(False,http),(True,tls)]:
            for path,destination in CASES.items():
                headers,_=probe(host,port,path,https=secure)
                assert headers['location']=='https://app.carterafinanciera.com/actualizar-app?destino='+destination
                assert 'no-store' in headers.get('cache-control','')
                checks+=1
            headers,body=probe(host,port,'/manifest.json',https=secure,expected=200)
            assert json.loads(body)['start_url']=='.'
            probe(host,port,'/logo192.png',https=secure,expected=200)
            probe(host,port,'/.git/config',https=secure,expected=404)
            checks+=3
    return checks

if phase=='preview':
    api=Path('/etc/nginx/sites-enabled/django-api')
    api_before=sha(api)
    site=(P/'site.conf').read_text()
    site=site.replace('listen [::]:80 default_server;','').replace('listen [::]:80;','').replace('listen [::]:443 ssl;','')
    site=site.replace('listen 80 default_server;','listen 127.0.0.1:18889 default_server;').replace('listen 80;','listen 127.0.0.1:18889;').replace('listen 443 ssl;','listen 127.0.0.1:18489 ssl;')
    (P/'preview-site.conf').write_text(site)
    conf=P/'preview-nginx.conf'
    conf.write_text('pid '+str(P/'preview.pid')+';\nerror_log '+str(P/'preview-error.log')+';\nevents {}\nhttp {\n include /etc/nginx/mime.types;\n access_log '+str(P/'preview-access.log')+';\n include '+str(P/'destinations.conf')+';\n include '+str(P/'preview-site.conf')+';\n}\n')
    run(['nginx','-t','-c',conf]);run(['nginx','-c',conf])
    challenge=Path('/var/www/html/.well-known/acme-challenge')/('transition-check-'+os.urandom(8).hex())
    challenge.parent.mkdir(parents=True,exist_ok=True);challenge.write_text('migration-check');os.chmod(challenge,0o644)
    try:
        checks=check_all(18889,18489)
        _,body=probe('carterafinanciera.com',18889,'/.well-known/acme-challenge/'+challenge.name,https=False,expected=200)
        assert body==b'migration-check'
        assert sha(api)==api_before
        proof={'previewPassed':True,'checks':checks+1,'loopbackOnly':True,'tlsVerificationEnabled':True,'installedLegacyManifestRetained':True,'productionApiConfigUnchanged':True,'productionRoutingChanged':False,'previousSiteSHA256':sha(Path('/etc/nginx/sites-available/default'))}
        save('preview.json',proof);print(json.dumps(proof))
    finally:
        challenge.unlink(missing_ok=True)
        run(['nginx','-s','quit','-c',conf])

elif phase=='apply':
    assert json.loads((P/'preview.json').read_text())['previewPassed']
    release=json.loads((P/'release.json').read_text())
    assert release['frontendVerifiedCommit']==release['commit'] and release['githubMainVerified']
    assert len(release['commit'])==40
    for name,expected in release['files'].items():assert sha(P/name)==expected,name
    default=Path('/etc/nginx/sites-available/default');mapping=Path('/etc/nginx/conf.d/cartera-legacy-destination.conf')
    assert sha(default)==release['expectedPreviousSiteSHA256'],'Site changed concurrently'
    assert not mapping.exists(),'Unexpected existing migration map'
    assert not (P/'applied.json').exists()
    api=Path('/etc/nginx/sites-enabled/django-api');api_before=sha(api)
    backup=P/'backup';backup.mkdir(mode=0o700)
    shutil.copy2(default,backup/'default.conf')
    try:
        shutil.copyfile(P/'destinations.conf',mapping);shutil.copyfile(P/'site.conf',default)
        os.chmod(mapping,0o644);os.chmod(default,0o644)
        run(['nginx','-t']);run(['systemctl','reload','nginx'])
        count=check_all(80,443)
        assert sha(api)==api_before
        proof={'applied':True,'appliedAtUTC':datetime.now(timezone.utc).isoformat(),'commit':release['commit'],'frontendDeployment':release['frontendDeployment'],'redirectStatus':302,'checks':count,'apiConfigurationUnchanged':True,'siteSHA256':sha(default),'mappingSHA256':sha(mapping),'backupDirectory':str(backup),'financialWrites':False}
        save('applied.json',proof);print(json.dumps(proof))
    except BaseException:
        shutil.copyfile(backup/'default.conf',default);mapping.unlink(missing_ok=True)
        run(['nginx','-t']);run(['systemctl','reload','nginx'])
        raise
else:raise ValueError('Unknown phase')
