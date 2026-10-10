"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FiAlertCircle,
  FiArrowRight,
  FiBarChart2,
  FiBell,
  FiBookOpen,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiExternalLink,
  FiHelpCircle,
  FiHome,
  FiMapPin,
  FiMessageCircle,
  FiPrinter,
  FiSearch,
  FiShield,
  FiShoppingCart,
  FiStar,
  FiTrendingDown,
  FiUsers,
} from "react-icons/fi";

const GUIDE_VERSION = "v2.3";
const GUIDE_UPDATED = "octubre de 2026";

const ROLES = {
  ambos: { label: "Todos", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  trabajador: { label: "Trabajador", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  administrador: { label: "Administrador", className: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
  root: { label: "Root", className: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
};

const QUICK_STARTS = [
  {
    id: "trabajador",
    role: "trabajador",
    icon: FiCheckCircle,
    eyebrow: "Para salir a cobrar",
    title: "Iniciar jornada",
    text: "Abre Liquidación, atiende los pendientes del día y cierra la caja al terminar.",
    href: "/dashboard/liquidar",
    action: "Ir a Liquidación",
    tone: "emerald",
  },
  {
    id: "administrador",
    role: "administrador",
    icon: FiShield,
    eyebrow: "Para controlar el negocio",
    title: "Revisar cartera",
    text: "Mira los créditos que requieren gestión, sus saldos y los riesgos por ruta.",
    href: "/dashboard/reportes/cartera",
    action: "Abrir cartera",
    tone: "indigo",
  },
];

const GUIDE_SECTIONS = [
  {
    id: "inicio",
    number: "01",
    role: "ambos",
    icon: FiHome,
    eyebrow: "Primeros pasos",
    title: "Entrar y elegir la ruta correcta",
    description: "El sistema conserva tus credenciales. Antes de registrar movimientos, confirma que estás en la ruta correcta; si tienes varias asignadas, elige en cuál trabajar.",
    href: "/select-store",
    action: "Seleccionar ruta",
    tone: "indigo",
    steps: [
      "Abre app.carterafinanciera.com en tu celular o computador. No uses el dominio antiguo www.carterafinanciera.com.",
      "Ingresa tu usuario y contraseña de siempre.",
      "Si eres trabajador y tienes una sola ruta activa, entrarás directamente a Liquidación. Si tienes varias, elige una en «Elige tu ruta». El administrador selecciona una ruta antes de abrir el panel.",
      "Confirma el nombre de la ruta que aparece en la parte superior antes de registrar movimientos. Para cambiarla, usa el botón «Ruta» del menú.",
    ],
    note: "Puedes agregar la aplicación a la pantalla de inicio desde las opciones del navegador para abrirla como una app.",
  },
  {
    id: "jornada",
    number: "02",
    role: "ambos",
    icon: FiCheckCircle,
    eyebrow: "Flujo diario de cobranza",
    title: "Cobrar, reportar y terminar la jornada",
    description: "Liquidación distingue las cuotas exigibles de los cobros voluntarios. La lista depende de la fecha, la modalidad y los abonos de cada crédito.",
    href: "/dashboard/liquidar",
    action: "Abrir Liquidación",
    tone: "emerald",
    steps: [
      "Confirma ruta y fecha en «Liquidación». El trabajador opera hoy; el administrador puede consultar otras fechas. Usa la búsqueda para localizar al cliente.",
      "Si paga, pulsa «Abonar Cuota» y registra el dinero realmente recibido. Se permiten abonos parciales, dobles o superiores a una cuota, sin superar el saldo.",
      "En un semanal o mensual sin cuota exigible ni anticipos no es necesario registrar una falla. Cuando tiene anticipos y saldo pendiente puede aparecer como «Adelantado · cobro voluntario»; no exige otro pago ni permite una falla injustificada.",
      "Si tiene una obligación pendiente y no paga o no lo encuentras, registra la incidencia correspondiente. Una visita reduce la tarea de gestión, pero no elimina la deuda.",
      "Un abono no siempre hace desaparecer el crédito: los semanales y mensuales pueden permanecer para otro cobro voluntario. Revisa la etiqueta, el saldo y la próxima cuota, no solo si aparece en la lista.",
      "Para un anticipo fuera del recorrido, abre el detalle del crédito y usa «Agregar pago». El movimiento queda con la fecha registrada; comprueba monto y fecha antes de confirmar.",
      "Usa WhatsApp para preparar el estado de cuenta y enviarlo desde tu cuenta. También está disponible en la proyección futura si el cliente tiene un teléfono válido; abrir WhatsApp no registra un pago ni envía el mensaje por sí solo.",
      "Registra los gastos reales de la jornada en «Control Gastos», con monto, fecha y concepto, antes de revisar el cierre. Un gasto no es un abono del cliente ni un retiro de utilidad.",
      "Al terminar, entra a «Cierre de Caja» y registra el cierre calculado por el sistema.",
    ],
    note: "El GPS ayuda a comprobar dónde ocurrió el cobro, pero puede registrarse sin ubicación. Si una respuesta falla y no sabes si se guardó, revisa Recaudos o el detalle del crédito antes de repetir el movimiento para evitar duplicados.",
  },
  {
    id: "asignar-rutas",
    number: "03",
    role: "administrador",
    icon: FiUsers,
    eyebrow: "Administración de personal",
    title: "Dar acceso a un trabajador a varias rutas",
    description: "Un trabajador puede usar la misma cuenta en varias rutas del mismo administrador. No hace falta crearle un usuario y una contraseña distintos para cada ruta.",
    href: "/dashboard/trabajadores",
    action: "Administrar trabajadores",
    tone: "indigo",
    steps: [
      "Entra a la ruta de destino y abre «Trabajadores».",
      "Pulsa «Asignar trabajador existente». Solo aparecen trabajadores de otras rutas del mismo administrador que todavía no tengan acceso a esta ruta.",
      "Pulsa «Asignar» junto al trabajador. Se conserva su cuenta y contraseña; no crees un usuario duplicado. Cada pago o visita sigue asociado a la ruta seleccionada.",
      "Al iniciar sesión, si tiene una sola ruta activa, entrará directamente a Liquidación. Si tiene varias, verá «Elige tu ruta» y deberá escoger dónde va a trabajar.",
      "Para cambiar de ruta durante la jornada, usa «Ruta» en el menú, selecciona la siguiente y confirma su nombre antes de registrar pagos o visitas.",
      "Para quitarle acceso únicamente a esta ruta, usa «Quitar ruta» en su ficha de la lista y confirma. La cuenta y las asignaciones a otras rutas se conservan.",
    ],
    note: "La ruta de destino debe estar activa y el trabajador debe pertenecer al mismo administrador propietario. La asignación no cambia su rol ni sus permisos y no permite compartir cuentas entre administradores distintos.",
  },
  {
    id: "nueva-venta",
    number: "04",
    role: "ambos",
    icon: FiShoppingCart,
    eyebrow: "Otorgar un crédito",
    title: "Crear una nueva venta correctamente",
    description: "Antes de activar un crédito revisa el comportamiento del cliente, el cupo disponible y la frecuencia de cobro.",
    href: "/dashboard/ventas/nueva",
    action: "Crear venta",
    tone: "violet",
    steps: [
      "Ve a «Ventas Activas» y pulsa «Nueva Venta».",
      "Busca y selecciona el cliente. Revisa su score, sus créditos vigentes y el cupo disponible.",
      "Ingresa capital e interés. El interés corresponde al crédito completo; no se repite cada semana o mes.",
      "Selecciona la frecuencia: Diario, Semanal o Mensual. El trabajador solo puede usar Diario; el administrador puede elegir las tres.",
      "Cambiar de frecuencia propone 20 cuotas diarias, 4 semanales o 1 mensual. Puedes ajustar el número antes de guardar; revisa el valor resultante de cada cuota.",
      "Con la propuesta de 4 cuotas semanales, los vencimientos son a los 7, 14, 21 y 28 días desde el inicio. En un mensual nuevo de una cuota, todo el total vence el mismo día del mes siguiente; si ese día no existe, usa el último día de ese mes.",
      "Revisa la primera cuota, la última, el total a pagar y todas las fechas de la proyección. Pulsa «Activar Crédito» solo cuando coincidan con lo acordado.",
    ],
    frequency: [
      ["Diario", "20", "1 cuota cada día"],
      ["Semanal", "4", "Cada 7 días · total / 4"],
      ["Mensual", "1", "Mes calendario · todo el total"],
    ],
    note: "Estos valores son propuestas para créditos nuevos, no una conversión de contratos antiguos. Los históricos conservan sus condiciones: consulta su calendario. Si hay cupo bloqueado o señales de riesgo, el administrador debe revisar antes de continuar.",
  },
  {
    id: "seguimiento",
    number: "05",
    role: "administrador",
    icon: FiBell,
    eyebrow: "Control preventivo",
    title: "Leer la cartera y las alertas a tiempo",
    description: "Las señales separan la gestión del día del deterioro real del crédito. No todo cliente que no abonó hoy está atrasado.",
    href: "/dashboard/alertas",
    action: "Abrir alertas",
    tone: "amber",
    steps: [
      "En «Ventas Activas» usa los filtros «Gestionar hoy», «Sin abono», «Con cuotas atrasadas» y los niveles de riesgo.",
      "Revisa «días sin abono» como jornadas completas cerradas. El día actual no se cuenta antes de terminar.",
      "«Ayer» indica cuándo fue el último abono; no significa por sí solo que exista atraso. En semanales y mensuales revisa las obligaciones vencidas y el dinero acumulado abonado: un anticipo puede cubrir varias cuotas.",
      "«Para ponerse al día» muestra el monto de cuotas atrasadas y nunca debe superar el saldo actual.",
      "En el «Centro de alertas» revisa solo las señales activas de la ruta seleccionada. Puedes marcarlas como revisadas o resueltas.",
    ],
    note: "Las alertas informan y ayudan a priorizar; no bloquean automáticamente un crédito. Si el cliente vuelve a estar al día, la señal operativa deja de ser prioritaria.",
  },
  {
    id: "telegram",
    number: "06",
    role: "ambos",
    icon: FiMessageCircle,
    eyebrow: "Avisos de cara al cliente",
    title: "Activar y administrar los avisos por Telegram",
    description: "La suscripción es voluntaria y se activa desde la ficha de cada cliente. Una vez vinculada, esa persona puede recibir movimientos de sus créditos y consultar la información disponible en el bot.",
    href: "/dashboard/clientes",
    action: "Buscar clientes",
    tone: "sky",
    steps: [
      "Entra a la ruta correcta, abre «Clientes», busca a la persona y entra a su perfil. Administradores y trabajadores asignados pueden gestionar Telegram dentro de sus rutas autorizadas.",
      "Pregunta si desea recibir avisos. Pulsa «Enviar por WhatsApp», revisa que el destinatario sea correcto y envía el mensaje preparado. Incluye enlaces oficiales para Android y iPhone; WhatsApp no lo envía hasta que pulses «Enviar».",
      "Cuando el cliente confirme que instaló Telegram y creó su cuenta, pulsa «Generar enlace». Cópialo y envíaselo directamente al cliente. El enlace es personal, de un solo uso y vence a los 15 minutos; si vence, genera otro.",
      "El cliente abre el enlace en la conversación privada con el bot y acepta vincular ese chat. Aceptar solo crea una solicitud: todavía no se muestran datos ni se activan avisos financieros.",
      "Cuando la ficha indique «Pendiente de confirmación», verifica que el cliente aceptó la invitación que tú le enviaste y confirma el chat ID en su perfil. Los avisos comienzan cuando el estado muestre «Activo».",
      "Desde entonces se avisa cuando se registra un crédito nuevo (monto solicitado, total a pagar y plazo), un abono, una visita sin pago, una corrección/anulación, un ajuste de fecha o cuotas, o una renovación. Cada mensaje muestra la fecha, estado, avance —por ejemplo, «1 de 20»—, total abonado y saldo. Una visita sin pago solo se notifica si el trabajador la registra; no hay recordatorios automáticos por proximidad de una cuota.",
      "El cliente puede abrir el menú del bot con «/menu» y consultar «/creditos» o «/movimientos». Son consultas de solo lectura y muestran los créditos activos y movimientos disponibles.",
      "La vinculación pertenece a esa ficha de cliente y continúa para sus futuros créditos. Si la misma persona tiene otra ficha en una ruta distinta, repite allí la invitación y confirmación; puedes vincular ambas fichas al mismo chat, pero el sistema nunca las une por teléfono o nombre.",
      "Para dejar de enviar avisos, pulsa «Revocar» en la ficha. El bot intenta borrar los mensajes registrados después de unas 24 horas; esto no revoca la vinculación ni detiene los avisos futuros. Para detenerlos, debes revocar el vínculo.",
    ],
    note: "El cliente debe aceptar la invitación; no se vincula por número telefónico. Los mensajes del cliente no muestran nombres de ruta, URL del sistema ni comentarios internos. Los avisos de Telegram son informativos: si un cliente dice que un movimiento no corresponde, verifica siempre el registro en la aplicación.",
  },
  {
    id: "caja",
    number: "07",
    role: "ambos",
    icon: FiCreditCard,
    eyebrow: "Control del efectivo",
    title: "Cerrar caja y consultar el historial",
    description: "El cierre deja una fotografía diaria del balance. El historial de movimientos permite seguir quién cambió la caja y cómo quedó el saldo.",
    href: "/dashboard/cierre-caja",
    action: "Abrir Cierre de Caja",
    tone: "slate",
    steps: [
      "Al finalizar la jornada entra a «Cierre de Caja».",
      "Revisa el resumen del día: aportes, recaudos, créditos, gastos y utilidades.",
      "El sistema calcula automáticamente el valor del cierre. No debes inventar ni ingresar otro saldo en un campo manual.",
      "Pulsa «Registrar Cierre». El trabajador cierra su día actual; el administrador puede consultar y gestionar fechas permitidas.",
      "En «Movimientos de Caja» revisa fecha, usuario, tipo, saldo anterior, variación y saldo posterior.",
    ],
    note: "El historial auditable registra movimientos desde que fue habilitado. Los cierres antiguos siguen siendo referencias independientes y no siempre tienen el detalle histórico de cada movimiento.",
  },
  {
    id: "reportes",
    number: "08",
    role: "administrador",
    icon: FiBarChart2,
    eyebrow: "Análisis del negocio",
    title: "Usar cada reporte para la decisión correcta",
    description: "No todos los reportes responden la misma pregunta ni usan el mismo filtro de fecha.",
    href: "/dashboard/reportes/cartera",
    action: "Abrir reportes",
    tone: "purple",
    reports: [
      ["Utilidad", "Capital recuperado primero, interés cobrado, gastos, pérdidas y utilidad estimada o cobrada.", "/dashboard/reportes/utilidad"],
      ["Cartera", "Saldo activo, mora, capital expuesto, cuotas equivalentes vencidas y créditos para gestionar.", "/dashboard/reportes/cartera"],
      ["Gastos", "Total por periodo, categorías, días con gasto y detalle exportable.", "/dashboard/reportes/gastos"],
      ["Visitas", "Abonos y visitas fallidas de una fecha, con filtros por motivo y trabajador.", "/dashboard/reportes/visitas"],
      ["Comparativo", "Compara dos periodos y muestra variaciones de ventas, gastos, pérdidas y utilidad.", "/dashboard/reportes/comparativo"],
      ["Mapa de Cobros", "Muestra cobros con GPS, no un recorrido continuo. El mapa de entregas se consulta en «Publicidad».", "/dashboard/reportes/ubicaciones"],
    ],
    note: "Para una fecha puntual usa Visitas o Mapa de Cobros. Para analizar un periodo usa Utilidad, Cartera, Gastos o Comparativo. Las entregas se revisan en Publicidad.",
  },
  {
    id: "cliente-riesgo",
    number: "09",
    role: "administrador",
    icon: FiStar,
    eyebrow: "Decisiones de crédito",
    title: "Consultar clientes, renovar o declarar pérdida",
    description: "El perfil del cliente reúne el comportamiento histórico y las decisiones que pueden afectar el capital del negocio.",
    href: "/dashboard/clientes",
    action: "Abrir clientes",
    tone: "rose",
    steps: [
      "En «Clientes» busca por nombre, teléfono o documento y abre el perfil.",
      "Revisa el score sobre 100, la etiqueta —Excelente, Bueno, Regular, Riesgo o Sin historial—, el cupo recomendado y las señales activas.",
      "Para un crédito vencido, el administrador puede usar «Renovar». El crédito anterior queda identificado como Renovado y el nuevo usa el saldo pendiente como base.",
      "Marca como «Pérdida» solo después de revisar el caso. Exige escribir CONFIRMAR y bloquea al cliente para nuevos créditos; conserva el saldo y no impide registrar una recuperación posterior. Las nuevas declaraciones guardan la fecha y los montos de ese momento.",
      "Consulta «Ventas en Pérdida» para revisar el capital no recuperado y el análisis de pérdidas.",
    ],
    note: "El score orienta, no reemplaza la revisión del caso. Declarar pérdida no equivale a una pérdida definitiva neta del mes ni borra el historial. Una discrepancia o una señal de riesgo no demuestra por sí sola fraude.",
  },
  {
    id: "publicidad",
    number: "10",
    role: "ambos",
    icon: FiMapPin,
    eyebrow: "Trabajo en terreno",
    title: "Registrar y revisar publicidad",
    description: "Administradores y trabajadores registran entregas y consultan el mapa del equipo completo de la ruta seleccionada.",
    href: "/dashboard/publicidad",
    action: "Abrir publicidad",
    tone: "cyan",
    steps: [
      "En «Publicidad» puedes consultar mapa y lista sin permitir el GPS. Filtra por fecha, responsable, tus registros o texto; el trabajador ve a todo el equipo de su ruta autorizada.",
      "Para registrar, confirma la ruta y pulsa «Registrar entrega aquí». Permite la ubicación cuando el navegador la solicite; el administrador también puede registrar con su usuario real.",
      "Agrega una nota opcional, por ejemplo el nombre del local, y confirma el registro.",
      "El trabajador solo puede eliminar sus puntos de hoy; el administrador puede eliminar los de su ruta. La eliminación es definitiva y exige confirmación.",
      "Si falla el guardado, reintenta la misma entrega. Si cerraste o recargaste después de un error, revisa la lista antes de registrarla nuevamente para evitar duplicados.",
      "Todo el seguimiento está en «Publicidad»: consulta mapa, historial y filtros por fecha o responsable, incluidos administradores. No necesitas abrir un reporte separado.",
      "Las secuencias unen registros del mismo responsable y día, no un recorrido GPS real. Aún no se calculan objetivos, pendientes ni cobertura territorial.",
    ],
    note: "La ubicación solo es necesaria para registrar o ver «Mi ubicación». La nota es opcional; GPS impreciso o desconocido requiere revisión, no demuestra por sí solo fraude.",
  },
  {
    id: "indicadores-liquidar",
    number: "11",
    role: "ambos",
    icon: FiDollarSign,
    eyebrow: "Leer los números del día",
    title: "Entender los tres totales de Liquidación",
    description: "Las tarjetas no significan lo mismo. Buscar un cliente solo cambia el pendiente del filtro, no el total descriptivo del día ni lo ya cobrado de toda la ruta.",
    href: "/dashboard/liquidar",
    action: "Revisar Liquidación",
    tone: "emerald",
    steps: [
      "En la versión actual, «Total a cobrar del día» suma el pendiente exigible de la lista completa más los abonos reales del día. Es un total descriptivo: puede incluir atrasos o anticipos y no representa una base fija de cuotas ni una meta garantizada. Buscar un cliente no cambia este total.",
      "«Pendiente por cobrar» es lo exigible que sigue sin pagar y puede incluir deuda atrasada. Si buscas un cliente, suma solo las coincidencias en todas las páginas; al quitar el filtro vuelve a mostrar la ruta completa.",
      "«Total cobrado del día» muestra los abonos reales de la ruta para esa fecha, sin asientos de renovación. Puede superar las cuotas del día si se reciben anticipos o se recupera deuda anterior.",
      "Una falla o visita no es un cobro: la deuda pendiente continúa aunque la gestión ya esté registrada. Tampoco confundas estos totales con la caja disponible o la utilidad.",
      "Como administrador, una fecha futura abre una proyección que supone que no habrá nuevos pagos desde hoy. Puedes consultar y preparar WhatsApp, pero no abonar, registrar fallas ni editar el recorrido en esa vista.",
    ],
    note: "No uses el total descriptivo como una meta fija: los pagos y cambios en la lista pueden modificarlo. Liquidación no reconstruye por completo la cartera histórica; para analizar resultados de un período utiliza los reportes.",
  },
  {
    id: "recorrido",
    number: "12",
    role: "ambos",
    icon: FiMapPin,
    eyebrow: "Organizar la jornada",
    title: "Cambiar el orden de los clientes",
    description: "El administrador y el trabajador pueden guardar un recorrido compartido para su ruta. Ordenar no cambia cuotas, saldos, calificación ni fechas de pago.",
    href: "/dashboard/liquidar",
    action: "Organizar desde Liquidación",
    tone: "cyan",
    steps: [
      "En Liquidación de hoy pulsa «Organizar recorrido». El organizador reúne todos los clientes con créditos activos, no solo los de la fecha o página que estabas viendo.",
      "Busca por nombre, apellido o dirección. Arrastra desde el asa junto al número; la línea indica dónde quedará el cliente. En celular, desliza desde el nombre o la dirección para recorrer la lista sin moverlo.",
      "También puedes usar Subir, Bajar, Al inicio o «Antes / después» con un cliente de referencia. Con el asa enfocada, las flechas del teclado mueven un puesto.",
      "Soltar cambia solo el borrador. Pulsa «Guardar cambios» para aplicar el nuevo orden a toda la ruta o «Cancelar» para descartarlo. El orden guardado lo comparte el equipo.",
      "Si el recorrido cambió mientras editabas, recarga y revisa antes de guardar otra vez. Si falla la conexión, no des por guardado el cambio hasta recibir confirmación.",
    ],
    note: "La lista sigue respetando cuándo corresponde cobrar. Los clientes nuevos sin posición quedan al final; los créditos de un mismo cliente se agrupan. El recorrido no es un mapa GPS ni un cambio de prioridad financiera.",
  },
  {
    id: "interpretar-utilidad",
    number: "13",
    role: "administrador",
    icon: FiBarChart2,
    eyebrow: "Resultado y retiros",
    title: "Interpretar utilidad sin confundirla con caja",
    description: "El reporte describe los registros de la ruta seleccionada. No fija metas ni reparte dinero automáticamente entre socios.",
    href: "/dashboard/reportes/utilidad",
    action: "Abrir reporte de utilidad",
    tone: "purple",
    steps: [
      "Selecciona ruta y período y genera el reporte. Usa las ayudas de cada indicador para consultar qué incluye y qué excluye.",
      "«Resultado cobrado antes de pérdidas» es interés reconocido como cobrado menos gastos registrados. El capital recuperado no es utilidad; este resultado aún no descuenta pérdidas de capital ni retiros.",
      "«Resultado del período menos retiros» compara ese resultado con los retiros de las mismas fechas. No es saldo de caja ni una autorización para retirar: puede haber dinero nuevamente prestado u obligaciones pendientes.",
      "Distingue capital de créditos nuevos, capital renovado y capital sin clasificación comprobable. Una renovación no representa necesariamente dinero nuevo entregado o cobrado.",
      "No sumes las pérdidas por fecha de origen a las declaraciones por fecha de declaración: son lecturas distintas. Los históricos sin fecha comprobable se muestran aparte, no como pérdidas del mes seleccionado.",
      "Si aparece «No disponible», no lo interpretes como cero. Revisa las advertencias y los movimientos por aclarar; no prueban por sí solos una pérdida o fraude. Exporta el CSV del reporte ya generado si necesitas compartirlo.",
    ],
    note: "Cambiar las fechas del formulario no actualiza el informe ni su CSV hasta generar otro. Cada administrador define su política de retiros y socios; el reporte no garantiza una utilidad mensual ni certifica efectivo libre.",
  },
  {
    id: "membresias",
    number: "14",
    role: "ambos",
    icon: FiClock,
    eyebrow: "Continuidad del acceso",
    title: "Revisar o renovar la membresía de la ruta",
    description: "La membresía pertenece a cada ruta. Una suspensión de acceso no significa que se hayan eliminado sus clientes o movimientos.",
    href: "/dashboard/membresias",
    action: "Consultar membresía",
    tone: "amber",
    steps: [
      "Confirma la ruta y revisa el estado, plan y vencimiento en «Membresías». Si aparece «Acceso Suspendido», puedes abrir «Activar / Renovar Plan» para consultar las opciones disponibles.",
      "Tramita la renovación siguiendo las instrucciones y guarda el comprobante cuando corresponda. Verifica que la solicitud esté confirmada y el estado permita operar antes de retomar los cobros.",
      "Si la ruta fue vencida manualmente por root, el bloqueo operativo es inmediato, aunque antes tuviera una fecha futura, gracia o preactivación. Los clientes, créditos, pagos y caja se conservan.",
      "En un vencimiento manual, subir un comprobante no devuelve acceso temporal: la renovación requiere aprobación. Si tienes otra ruta autorizada, puedes cambiar de ruta sin perder la cuenta.",
    ],
    note: "Administradores y trabajadores no pueden quitar un vencimiento manual por su cuenta. Si el estado no coincide con una renovación confirmada, actualiza la pantalla y contacta a quien administra la suscripción; no registres movimientos duplicados.",
  },
  {
    id: "membresias-root",
    number: "15",
    role: "root",
    icon: FiShield,
    eyebrow: "Solo superusuario",
    title: "Corregir una activación de membresía equivocada",
    description: "Vencer la suscripción y corregir un ingreso son decisiones separadas. Esta función solo está disponible para root, no para el administrador de la ruta.",
    href: "/dashboard/admin/rutas",
    action: "Administrar rutas como root",
    tone: "rose",
    steps: [
      "Abre «Administrar rutas», entra al detalle y pulsa «Vencer membresía manualmente». Comprueba nombre, identificador, administrador, plan y vencimiento para no corregir otra ruta.",
      "Escribe el motivo obligatorio. La confirmación bloquea la operación de esa ruta sin gracia; root conserva acceso y el cambio queda en el historial con usuario, fecha y estados anterior y nuevo.",
      "Solo si también registraste un ingreso manual por error, marca «Anular también un pago manual registrado por error» y selecciona el pago correcto. La opción está desmarcada inicialmente y solo admite pagos manuales vigentes de esa ruta, sin solicitud asociada.",
      "Anular conserva el pago en el historial y lo excluye de los ingresos vigentes. No borra recaudos de los clientes ni hace una devolución de dinero. Si hay solicitudes pendientes, confirma que las revisaste; no se anulan con este paso.",
      "Una ruta ya vencida permite «Revisar vencimiento / corregir ingreso» si tiene un pago manual elegible, sin renovar antes. Si el estado cambió o el resultado es incierto, usa «Recargar detalle» y verifica antes de volver a enviar.",
      "Para devolver el acceso, realiza una renovación válida. Cancelar el diálogo no cambia la suscripción ni los pagos.",
    ],
    note: "No uses esta corrección para simular ingresos, ocultar pagos reales o modificar la cartera. Revisa el historial y el total vigente después de confirmar.",
  },
  {
    id: "movimientos-negocio",
    number: "16",
    role: "administrador",
    icon: FiCreditCard,
    eyebrow: "Clasificar entradas y salidas",
    title: "Registrar gastos, aportes y retiros correctamente",
    description: "Usa el módulo que corresponde al movimiento real. Registrar dinero en una categoría equivocada altera la lectura de caja y resultados.",
    href: "/dashboard/cierre-caja",
    action: "Revisar caja y movimientos",
    tone: "slate",
    steps: [
      "En «Control Gastos» registra los desembolsos operativos con su fecha, monto y concepto. El trabajador puede registrar gastos; las acciones de corrección visibles dependen del rol.",
      "En «Gestión Aportes» registra el capital que entra al negocio. Un aporte aumenta recursos, pero no es pago de un cliente ni utilidad generada.",
      "En «Utilidades» registra una salida efectivamente realizada, con su fecha, valor y destinatario. Este módulo registra retiros; no genera una ganancia ni autoriza automáticamente cuánto sacar.",
      "Si hay un registro equivocado, revisa su detalle y las opciones de edición o anulación antes de actuar. Estas correcciones afectan la caja; no agregues un movimiento ficticio para compensar sin revisar el original.",
      "Contrasta los movimientos con «Cierre de Caja» y el reporte de utilidad. Evita registrar la misma salida como gasto y como retiro.",
    ],
    note: "El cierre calculado no sustituye la comprobación del efectivo real. Si hay diferencias, investiga los movimientos; no cambies categorías ni borres registros solo para hacer coincidir una cifra.",
  },
  {
    id: "registrar-cliente",
    number: "17",
    role: "ambos",
    icon: FiUsers,
    eyebrow: "Datos antes de prestar",
    title: "Crear una ficha y mantener el contacto correcto",
    description: "Una ficha bien identificada evita confundir créditos, duplicar clientes o enviar el estado de cuenta a otra persona.",
    href: "/dashboard/clientes",
    action: "Revisar clientes",
    tone: "indigo",
    steps: [
      "Confirma la ruta y busca primero al cliente por identificación, nombre o establecimiento. Si ya tiene una ficha en esa ruta, úsala antes de crear otra.",
      "Si no existe, crea el cliente desde «Clientes» y completa los campos solicitados, especialmente identificación, nombre, dirección y teléfono con su prefijo correcto.",
      "Verifica los datos en el perfil antes de otorgar un crédito o preparar WhatsApp. Si algo está equivocado, utiliza la edición disponible según tus permisos.",
      "Consulta los créditos e historial de esa ficha. Crear un cliente no activa por sí solo un crédito ni lo vincula automáticamente a Telegram; esas acciones se realizan por separado.",
    ],
    note: "El mismo nombre o teléfono no demuestra que sean la misma ficha. Confirma la identificación y la ruta; no compartas el estado de cuenta ni una invitación personal sin verificar al destinatario.",
  },
];

const FAQS = [
  ["¿Debo crear otro usuario para cada ruta?", "No. Desde la ruta de destino, un administrador puede asignar a un trabajador existente de otra ruta propia. Se conserva su cuenta y contraseña; al entrar, el trabajador elige qué ruta operar cuando tiene más de una asignada."],
  ["El trabajador no ve una ruta que debería tener", "Confirma que la ruta de destino esté activa y que el trabajador pertenezca a una ruta del mismo administrador. En la ruta de destino, abre «Trabajadores» y asígnalo con «Asignar trabajador existente». Si ya aparece en la lista, ya tiene acceso."],
  ["¿El botón «Salir» quita las rutas asignadas?", "No. «Salir» cierra la sesión del trabajador. Para retirar su acceso a una ruta, el administrador debe usar «Quitar ruta» desde «Trabajadores» en esa ruta; sus otras asignaciones permanecen."],
  ["No veo al cliente en Liquidación", "Confirma ruta, fecha y búsqueda. Un semanal o mensual sin cuota exigible ni anticipos no tiene que aparecer antes de su fecha; un crédito totalmente pagado o en pérdida tampoco aparece. Consulta el detalle del crédito para comprobar calendario y saldo."],
  ["El cliente adelantó pagos, ¿debo ponerle falla?", "No, si no tiene una obligación exigible pendiente. La etiqueta «Adelantado · cobro voluntario» permite recibir otro abono, pero no exige pago ni falla para completar la gestión del día."],
  ["Busco un cliente y el total del día no cambia", "Es correcto. «Total a cobrar del día» y «Total cobrado del día» no responden a la búsqueda; «Pendiente por cobrar» sí suma únicamente los clientes del filtro, incluso si ocupan varias páginas. El total actual es cobrado más pendiente, no una base fija de cuotas."],
  ["Mañana no me deja abonar, ¿es un error?", "No. Para administradores, una fecha futura es una proyección de solo lectura. Puedes preparar el estado de cuenta por WhatsApp, pero pagos, fallas y edición del recorrido requieren una fecha de operación permitida."],
  ["Moví los clientes, pero el orden no cambió", "Arrastrar solo modifica el borrador. Pulsa «Guardar cambios» y espera la confirmación. El recorrido guardado es compartido por la ruta; si alguien lo cambió mientras editabas, recarga antes de volver a guardar."],
  ["¿El mensual nuevo siempre vence a los 30 días?", "No. Usa un mes calendario: el mismo día del mes siguiente o el último día si no existe. Los contratos antiguos conservan su calendario; revisa la proyección y las fechas de ese crédito."],
  ["El pago dio error y no sé si quedó guardado", "Antes de registrarlo otra vez, revisa Recaudos y el detalle del crédito. No confundas una respuesta de conexión fallida con la certeza de que no se guardó. Si no puedes comprobarlo, consulta al administrador."],
  ["¿El resultado del reporte es lo que puedo retirar?", "No. El resultado cobrado, el resultado menos retiros y la caja son conceptos distintos. El reporte no aprueba retiros ni reparte utilidades entre socios; revisa las ayudas, las pérdidas y las obligaciones de la ruta."],
  ["Subí el comprobante y la ruta sigue vencida manualmente", "En una suspensión manual el comprobante espera aprobación y no habilita acceso temporal. Revisa la solicitud en Membresías y contacta a quien administra la suscripción. Los registros de la ruta no se borran."],
  ["El mapa no muestra un cobro", "El registro puede existir sin coordenadas. Revisa la lista de operaciones sin GPS y verifica que el navegador tenga permiso de ubicación."],
  ["La alerta dice Ayer, ¿está atrasado?", "No necesariamente. Ayer solo identifica el día del último abono. El atraso se interpreta con cuotas atrasadas y con la frecuencia del crédito."],
  ["La caja no coincide", "Revisa primero Movimientos de Caja: tipo, usuario, saldo anterior y posterior. Luego compara el cierre con los recaudos, gastos, aportes y utilidades del día."],
  ["El cliente aceptó Telegram, pero sigue Pendiente", "La aceptación del cliente no activa por sí sola los avisos. Abre su ficha, confirma el chat ID asociado a la invitación que le enviaste y verifica que el estado cambie a Activo."],
  ["¿Son los avisos del cliente los mismos informes internos?", "No. Esta sección explica los movimientos que un cliente puede recibir en su chat privado después de vincularse. Los reportes y alertas operativas de los administradores son independientes."],
  ["El enlace de invitación venció", "Los enlaces duran 15 minutos y son de un solo uso. Genera uno nuevo desde la ficha del cliente y envíalo directamente a esa persona."],
  ["Un cliente tiene créditos en dos rutas", "Cada ficha de cliente se vincula por separado. Si la persona quiere recibir avisos de ambas, envía y confirma una invitación desde cada ficha; ambas pueden llegar al mismo chat de Telegram."],
  ["¿Telegram avisa automáticamente que una cuota está próxima?", "No. El bot notifica los movimientos y las visitas sin abono que el trabajador registra en el sistema; no sustituye el seguimiento de cobro ni envía recordatorios automáticos por vencimiento."],
  ["El cliente no recibió un aviso", "Confirma que la ficha esté Activa, que no haya bloqueado el bot y que el abono o la visita sin pago se haya guardado correctamente. Si todo está bien, informa al administrador para revisar la entrega; no registres de nuevo un movimiento solo para repetir el mensaje."],
  ["¿Borrar mensajes desactiva Telegram?", "No. La limpieza automática intenta retirar los mensajes registrados luego de unas 24 horas, pero el vínculo sigue activo y los próximos avisos continúan. Usa «Revocar» en la ficha si el cliente ya no desea recibirlos."],
];

function RoleBadge({ role }) {
  const config = ROLES[role] || ROLES.ambos;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${config.className}`}>
      {role === "trabajador" ? <FiUsers size={11} /> : role === "administrador" || role === "root" ? <FiShield size={11} /> : <FiCheckCircle size={11} />}
      {config.label}
    </span>
  );
}

function GuideCard({ section }) {
  const Icon = section.icon;
  const toneClasses = {
    indigo: { bar: "bg-indigo-500", icon: "bg-indigo-600", soft: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300", border: "border-indigo-100 dark:border-indigo-900/30" },
    emerald: { bar: "bg-emerald-500", icon: "bg-emerald-600", soft: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300", border: "border-emerald-100 dark:border-emerald-900/30" },
    violet: { bar: "bg-violet-500", icon: "bg-violet-600", soft: "bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300", border: "border-violet-100 dark:border-violet-900/30" },
    amber: { bar: "bg-amber-500", icon: "bg-amber-600", soft: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300", border: "border-amber-100 dark:border-amber-900/30" },
    sky: { bar: "bg-sky-500", icon: "bg-sky-600", soft: "bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300", border: "border-sky-100 dark:border-sky-900/30" },
    slate: { bar: "bg-slate-500", icon: "bg-slate-700", soft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", border: "border-slate-200 dark:border-slate-700" },
    purple: { bar: "bg-purple-500", icon: "bg-purple-600", soft: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300", border: "border-purple-100 dark:border-purple-900/30" },
    rose: { bar: "bg-rose-500", icon: "bg-rose-600", soft: "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300", border: "border-rose-100 dark:border-rose-900/30" },
    cyan: { bar: "bg-cyan-500", icon: "bg-cyan-600", soft: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300", border: "border-cyan-100 dark:border-cyan-900/30" },
  }[section.tone] || {};

  return (
    <article id={section.id} className="guide-card scroll-mt-28 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <div className={`h-1.5 ${toneClasses.bar}`} />
      <div className="p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${toneClasses.icon} text-white shadow-lg`}>
              <Icon size={20} />
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black tracking-[0.18em] text-slate-400">{section.number}</span>
                <RoleBadge role={section.role} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{section.eyebrow}</p>
              <h2 className="mt-1 text-lg font-black leading-tight tracking-tight text-slate-900 dark:text-white">{section.title}</h2>
            </div>
          </div>
          <a href={`#${section.id}`} aria-label={`Enlace a ${section.title}`} className="hidden shrink-0 text-slate-300 transition hover:text-indigo-500 sm:block">
            <FiExternalLink size={15} />
          </a>
        </div>

        <p className="mt-5 text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">{section.description}</p>

        {section.steps && (
          <ol className="mt-6 space-y-3">
            {section.steps.map((step, index) => (
              <li key={step} className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[10px] font-black ${toneClasses.soft} ${toneClasses.border}`}>
                  {index + 1}
                </span>
                <span className="text-[12px] font-semibold leading-relaxed text-slate-600 dark:text-slate-300">{step}</span>
              </li>
            ))}
          </ol>
        )}

        {section.frequency && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-[0.8fr_1.3fr_1fr] bg-slate-50 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:bg-slate-800/70">
              <span>Plan</span><span>Cuotas propuestas</span><span>Calendario</span>
            </div>
            {section.frequency.map(([plan, cuotas, calendario]) => (
              <div key={plan} className="grid grid-cols-[0.8fr_1.3fr_1fr] border-t border-slate-100 px-3 py-3 text-[10px] font-bold text-slate-600 dark:border-slate-800 dark:text-slate-300">
                <span className="font-black text-slate-800 dark:text-white">{plan}</span><span>{cuotas}</span><span>{calendario}</span>
              </div>
            ))}
          </div>
        )}

        {section.reports && (
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {section.reports.map(([name, description, href]) => (
              <Link key={name} href={href} className="group rounded-2xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-indigo-200 hover:bg-indigo-50/60 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-indigo-800 dark:hover:bg-indigo-900/20">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black text-slate-800 dark:text-white">{name}</span>
                  <FiChevronRight className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" size={13} />
                </div>
                <p className="mt-1 text-[10px] font-medium leading-relaxed text-slate-400">{description}</p>
              </Link>
            ))}
          </div>
        )}

        <div className={`mt-6 flex items-start gap-2 rounded-2xl border p-3.5 ${toneClasses.soft} ${toneClasses.border}`}>
          <FiAlertCircle className="mt-0.5 shrink-0" size={14} />
          <p className="text-[11px] font-bold leading-relaxed">{section.note}</p>
        </div>

        <Link href={section.href} className={`mt-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] ${toneClasses.soft.split(" ")[1] || "text-indigo-600"} transition hover:gap-3`}>
          {section.action} <FiArrowRight size={13} />
        </Link>
      </div>
    </article>
  );
}

export default function GuiaRapidaPage() {
  const [roleFilter, setRoleFilter] = useState("todos");
  const [showFaq, setShowFaq] = useState(false);

  const visibleSections = GUIDE_SECTIONS.filter((section) => roleFilter === "todos" || section.role === "ambos" || section.role === roleFilter);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f8fc] text-slate-900 dark:bg-slate-950 dark:text-white">
      <style>{`
        html { scroll-behavior: smooth; }
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .print-root { background: white !important; padding: 0 !important; }
          .print-content { max-width: 100% !important; padding: 12px !important; }
          .print-cover { background: white !important; color: #0f172a !important; border: 2px solid #4f46e5 !important; box-shadow: none !important; page-break-after: avoid; }
          .print-cover * { color: #0f172a !important; }
          .print-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .guide-card { box-shadow: none !important; page-break-inside: avoid !important; break-inside: avoid !important; }
          .guide-card a[href^="/dashboard"] { display: none !important; }
          .guide-card p, .guide-card span { color: #334155 !important; }
        }
      `}</style>

      <header className="no-print sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 px-4 py-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <a href="#arriba" className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none"><FiBookOpen size={17} /></div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black tracking-tight text-slate-900 dark:text-white">Guía rápida</p>
              <p className="hidden truncate text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 sm:block">Sistema nuevo · referencia operativa</p>
            </div>
          </a>
          <div className="flex items-center gap-2">
            <a href="#secciones" className="hidden rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600 sm:block dark:text-slate-400 dark:hover:bg-slate-800">Secciones</a>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 active:scale-95 dark:shadow-none">
              <FiPrinter size={14} /><span className="hidden sm:inline">Imprimir / PDF</span><span className="sm:hidden">PDF</span>
            </button>
          </div>
        </div>
      </header>

      <main id="arriba" className="print-root">
        <div className="print-content mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
          <section className="print-cover relative overflow-hidden rounded-[2.5rem] bg-slate-950 px-6 py-8 text-white shadow-2xl shadow-indigo-200/40 sm:px-10 sm:py-12 dark:shadow-none">
            <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
            <div className="relative max-w-3xl">
              <div className="mb-5 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">
                <span className="rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1.5">Guía {GUIDE_VERSION}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Actualizada {GUIDE_UPDATED}</span>
              </div>
              <h1 className="max-w-2xl text-3xl font-black leading-[0.98] tracking-[-0.04em] sm:text-5xl">Trabaja con claridad. Controla la cartera a tiempo.</h1>
              <p className="mt-5 max-w-2xl text-sm font-medium leading-relaxed text-slate-300 sm:text-base">Una referencia práctica para cobrar, registrar créditos, revisar riesgos y mantener la caja bajo control desde el sistema nuevo.</p>
              <div className="mt-7 flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-300">
                <span className="inline-flex items-center gap-2"><FiCheckCircle className="text-emerald-400" /> Trabajador, administrador y root</span>
                <span className="inline-flex items-center gap-2"><FiHome className="text-cyan-300" /> Celular o computador</span>
              </div>
            </div>
          </section>

          <section className="no-print mt-5 flex flex-col gap-4 rounded-[2rem] border border-indigo-200 bg-indigo-50/90 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-indigo-600 p-3 text-white"><FiShield size={17} /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">Plataforma oficial</p>
                <h2 className="mt-1 text-base font-black text-indigo-950 dark:text-indigo-100">Registra todos los movimientos en el sistema vigente.</h2>
                <p className="mt-1 text-xs font-medium leading-relaxed text-indigo-800/80 dark:text-indigo-200/70">Usa <strong>app.carterafinanciera.com</strong> para que créditos, pagos, visitas y reportes queden en un solo lugar.</p>
              </div>
            </div>
            <a href="https://app.carterafinanciera.com" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-indigo-700">Abrir sistema <FiExternalLink size={13} /></a>
          </section>

          <section className="no-print mt-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Accesos según tu trabajo</p>
                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900 dark:text-white">Empieza por aquí</h2>
              </div>
              <a href="#secciones" className="hidden items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 transition hover:text-indigo-600 sm:flex">Ver guía completa <FiArrowRight size={13} /></a>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {QUICK_STARTS.map((item) => {
                const Icon = item.icon;
                const isEmerald = item.tone === "emerald";
                return (
                  <Link key={item.id} href={item.href} className={`group relative overflow-hidden rounded-[2rem] border p-5 transition hover:-translate-y-0.5 hover:shadow-xl sm:p-6 ${isEmerald ? "border-emerald-100 bg-emerald-50/70 dark:border-emerald-900/30 dark:bg-emerald-900/10" : "border-indigo-100 bg-indigo-50/70 dark:border-indigo-900/30 dark:bg-indigo-900/10"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg ${isEmerald ? "bg-emerald-600" : "bg-indigo-600"}`}><Icon size={20} /></div>
                      <RoleBadge role={item.role} />
                    </div>
                    <p className={`mt-6 text-[10px] font-black uppercase tracking-[0.18em] ${isEmerald ? "text-emerald-600" : "text-indigo-600"}`}>{item.eyebrow}</p>
                    <h3 className="mt-1 text-xl font-black tracking-tight text-slate-900 dark:text-white">{item.title}</h3>
                    <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">{item.text}</p>
                    <span className={`mt-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${isEmerald ? "text-emerald-700" : "text-indigo-700"}`}>{item.action} <FiArrowRight className="transition group-hover:translate-x-1" size={13} /></span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="no-print mt-8 rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><FiSearch size={17} /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Filtrar la guía</p>
                  <h2 className="mt-1 text-base font-black text-slate-900 dark:text-white">Muestra solo lo que necesitas leer</h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">El filtro organiza la lectura; no cambia tus permisos en el sistema.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {["todos", "trabajador", "administrador", "root"].map((role) => (
                  <button key={role} type="button" aria-pressed={roleFilter === role} onClick={() => setRoleFilter(role)} className={`rounded-xl px-3.5 py-2.5 text-[10px] font-black uppercase tracking-widest transition ${roleFilter === role ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"}`}>
                    {role === "todos" ? "Toda la guía" : ROLES[role].label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <nav id="secciones" aria-label="Índice de la guía" className="no-print mt-8 scroll-mt-28 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex min-w-max items-center gap-1">
              {visibleSections.map((section) => (
                <a key={section.id} href={`#${section.id}`} className="rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-300">{section.number} · {section.title.split(" ").slice(0, 3).join(" ")}</a>
              ))}
            </div>
          </nav>

          <div className="print-grid mt-6 grid gap-5 md:grid-cols-2">
            {visibleSections.map((section) => <GuideCard key={section.id} section={section} />)}
          </div>

          <section className="no-print mt-8 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <button type="button" aria-expanded={showFaq} aria-controls="guide-faqs" onClick={() => setShowFaq((value) => !value)} className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6">
              <span className="flex items-center gap-3"><span className="rounded-2xl bg-slate-100 p-3 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><FiHelpCircle size={18} /></span><span><span className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Ayuda rápida</span><span className="mt-1 block text-base font-black text-slate-900 dark:text-white">Problemas frecuentes</span></span></span>
              <FiChevronRight className={`text-slate-400 transition-transform ${showFaq ? "rotate-90" : ""}`} />
            </button>
            {showFaq ? <div id="guide-faqs" className="grid gap-3 border-t border-slate-100 p-5 dark:border-slate-800 sm:grid-cols-2 sm:p-6">{FAQS.map(([question, answer]) => <div key={question} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50"><p className="text-xs font-black text-slate-800 dark:text-white">{question}</p><p className="mt-2 text-[11px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">{answer}</p></div>)}</div> : null}
          </section>

          <footer className="print-footer mt-8 rounded-[2rem] border border-slate-200/80 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <FiMessageCircle className="mx-auto text-indigo-500" size={22} />
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">¿Necesitas ayuda?</p>
            <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">Contacta a tu administrador o usa el soporte por WhatsApp desde el menú «?».</p>
            <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-400">app.carterafinanciera.com · Guía {GUIDE_VERSION} · Actualizada {GUIDE_UPDATED}</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
