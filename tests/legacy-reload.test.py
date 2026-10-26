"""Exercise bounded reload readiness without starting Nginx or touching a server."""
import ast
from pathlib import Path
import subprocess
import unittest

source=Path(__file__).resolve().parents[1]/'ops/legacy-frontend/remote.py'
node=next(n for n in ast.parse(source.read_text()).body if isinstance(n,ast.FunctionDef) and n.name=='wait_for_reload')

class Clock:
    def __init__(self):self.now=0
    def monotonic(self):return self.now
    def sleep(self,seconds):self.now+=seconds

def readiness(probe):
    clock=Clock();namespace={'time':clock,'probe':probe,'subprocess':subprocess}
    exec(compile(ast.Module(body=[node],type_ignores=[]),str(source),'exec'),namespace)
    return namespace['wait_for_reload'],clock

class ReloadReadinessTests(unittest.TestCase):
    def test_old_worker_response_does_not_trigger_rollback_before_reload(self):
        calls=[]
        def probe(*args):
            calls.append(args)
            if len(calls)==1:raise AssertionError(('/',200))
            return {'location':'https://app.carterafinanciera.com/actualizar-app?destino=/dashboard'},b''
        wait,clock=readiness(probe);wait()
        self.assertEqual(len(calls),2);self.assertGreater(clock.now,0)

    def test_unexpected_redirect_is_not_accepted(self):
        wait,clock=readiness(lambda *args:({'location':'https://invalid.example/'},b''))
        with self.assertRaises(RuntimeError):wait()
        self.assertGreaterEqual(clock.now,15);self.assertLess(clock.now,16)

    def test_persistent_connection_error_is_bounded(self):
        def fail(*args):raise subprocess.CalledProcessError(7,['curl'])
        wait,clock=readiness(fail)
        with self.assertRaises(RuntimeError):wait()
        self.assertGreaterEqual(clock.now,15);self.assertLess(clock.now,16)

if __name__=='__main__':unittest.main()
