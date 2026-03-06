from fpdf import FPDF
import os, io
from datetime import datetime

def safe_text(text):
    """Replace characters not supported by Helvetica font"""
    replacements = {
        '\u2022': '-', '\u2013': '-', '\u2014': '-', '\u2018': "'", '\u2019': "'",
        '\u201c': '"', '\u201d': '"', '\u2026': '...', '\u00b7': '-',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    # Handle accented characters by encoding to latin-1
    try:
        text.encode('latin-1')
    except UnicodeEncodeError:
        cleaned = []
        for ch in text:
            try:
                ch.encode('latin-1')
                cleaned.append(ch)
            except UnicodeEncodeError:
                cleaned.append('?')
        text = ''.join(cleaned)
    return text

class SigafPDF(FPDF):
    def __init__(self, title="SIGAF"):
        super().__init__()
        self.doc_title = title
        self.set_auto_page_break(auto=True, margin=20)

    def header(self):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, safe_text(self.doc_title), align="L")
        self.cell(0, 8, datetime.now().strftime("%d/%m/%Y"), align="R", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(200, 200, 200)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f"SIGAF - Sistema Integral de Gestión de Activo Fijo | Página {self.page_no()}/{{nb}}", align="C")

    def title_page(self, title, subtitle, author=""):
        self.add_page()
        self.ln(60)
        self.set_font("Helvetica", "B", 32)
        self.set_text_color(30, 60, 120)
        self.cell(0, 15, safe_text(title), align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(5)
        self.set_font("Helvetica", "", 14)
        self.set_text_color(100, 100, 100)
        self.cell(0, 10, safe_text(subtitle), align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(10)
        self.set_draw_color(30, 60, 120)
        self.set_line_width(0.8)
        self.line(70, self.get_y(), 140, self.get_y())
        self.ln(15)
        if author:
            self.set_font("Helvetica", "", 11)
            self.set_text_color(80, 80, 80)
            self.cell(0, 8, safe_text(author), align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 11)
        self.cell(0, 8, datetime.now().strftime("Fecha: %d de %B de %Y"), align="C", new_x="LMARGIN", new_y="NEXT")

    def section_title(self, title, num=""):
        self.ln(6)
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(30, 60, 120)
        txt = f"{num}. {title}" if num else title
        self.cell(0, 10, safe_text(txt), new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(30, 60, 120)
        self.set_line_width(0.4)
        self.line(10, self.get_y(), 80, self.get_y())
        self.ln(4)

    def subsection(self, title):
        self.ln(3)
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(50, 50, 50)
        self.set_left_margin(10)
        self.set_x(10)
        self.cell(0, 8, safe_text(title), new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def body_text(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(40, 40, 40)
        self.set_left_margin(10)
        self.set_x(10)
        self.multi_cell(0, 6, safe_text(text))
        self.ln(2)

    def bullet_point(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(40, 40, 40)
        left = self.l_margin
        self.set_left_margin(left + 6)
        self.set_x(left + 6)
        self.multi_cell(0, 6, safe_text("- " + text))
        self.set_left_margin(left)

    def info_box(self, title, content):
        self.set_fill_color(240, 245, 255)
        self.set_draw_color(30, 60, 120)
        y_start = self.get_y()
        self.rect(10, y_start, 190, 25, style="DF")
        self.set_xy(15, y_start + 3)
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(30, 60, 120)
        self.cell(0, 6, safe_text(title), new_x="LMARGIN", new_y="NEXT")
        self.set_x(15)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(60, 60, 60)
        self.multi_cell(180, 5, safe_text(content))
        self.set_y(y_start + 28)

    def stats_table(self, headers, rows):
        self.set_font("Helvetica", "B", 9)
        self.set_fill_color(30, 60, 120)
        self.set_text_color(255, 255, 255)
        col_w = 190 / len(headers)
        for h in headers:
            self.cell(col_w, 8, safe_text(h), border=1, fill=True, align="C")
        self.ln()
        self.set_font("Helvetica", "", 9)
        self.set_text_color(40, 40, 40)
        fill = False
        for row in rows:
            if self.get_y() > 260:
                self.add_page()
            if fill:
                self.set_fill_color(245, 248, 255)
            else:
                self.set_fill_color(255, 255, 255)
            for val in row:
                self.cell(col_w, 7, safe_text(str(val)), border=1, fill=True, align="C")
            self.ln()
            fill = not fill


def generate_user_manual(stats, plazas_data):
    pdf = SigafPDF("SIGAF - Manual de Usuario")
    pdf.alias_nb_pages()
    pdf.title_page("SIGAF", "Manual de Usuario", "Sistema Integral de Gestión de Activo Fijo")

    # Table of contents
    pdf.add_page()
    pdf.section_title("Contenido")
    toc = [
        "1. Introduccion", "2. Acceso al Sistema", "3. Panel Principal (Dashboard)",
        "4. Gestion de Tiendas", "5. Modulo de Auditoria", "6. Escaneo de Codigos de Barras",
        "7. Clasificacion de Equipos", "8. Transferencias y Bajas",
        "9. Finalizacion de Auditoria", "10. Bitacoras y Exportacion",
        "11. Reportes y Graficas", "12. Panel de Administracion",
        "13. Configuracion y Perfil", "14. Reinicio de Datos",
        "15. Preguntas Frecuentes"
    ]
    for item in toc:
        pdf.bullet_point(item)

    # 1. Introduction
    pdf.add_page()
    pdf.section_title("Introducción", "1")
    pdf.body_text("SIGAF (Sistema Integral de Gestión de Activo Fijo) es una aplicación web diseñada para la realización de auditorías de inventario de equipo de cómputo en tiendas de conveniencia. La aplicación permite gestionar el inventario de equipos, realizar auditorías mediante escaneo de códigos de barras, y generar reportes detallados.")
    pdf.body_text("La aplicación está optimizada para su uso en dispositivos móviles (hand held con escáner), tablets y computadoras de escritorio.")
    pdf.subsection("Características principales")
    features = [
        "Dashboard con indicadores clave de rendimiento (KPIs) y gráficas interactivas",
        "Filtrado de tiendas por plaza (Este, Ensenada, Centro, Playas, Oficinas)",
        "Búsqueda de tiendas por CR o nombre",
        "Módulo de auditoría con escaneo de códigos de barras en tiempo real",
        "Escaneo con cámara del dispositivo móvil en tiempo real (sin necesidad de foto)",
        "Cancelación de auditorías con registro obligatorio del motivo",
        "Clasificación automática: Localizado, Sobrante, Sobrante Desconocido, No Localizado",
        "Registro manual de SOBRANTE DESCONOCIDO como ALTA en la tienda auditada",
        "Aplicación automática de BAJA a equipos no localizados al finalizar",
        "Captura fotográfica obligatoria de formatos de movimiento (ALTA/BAJA y Transferencias)",
        "Gestión de transferencias entre tiendas",
        "Exportación de movimientos en dos documentos Excel: SIGAF_AB y SIGAF_TRANSFERENCIAS",
        "Bitácoras con filtros por ALTA, BAJA y TRANSFERENCIA por separado",
        "Panel de administración para Super Administradores",
        "Interfaz bilingüe (Español/Inglés) con temas claro/oscuro",
        "Paletas de colores intercambiables (Profesional / Corporativo OXXO)",
        "Modo offline: escaneos se sincronizan al recuperar conexión"
    ]
    for f in features:
        pdf.bullet_point(f)

    pdf.subsection("Perfiles de usuario")
    pdf.body_text("El sistema cuenta con 3 perfiles de acceso:")
    profiles = [
        "Super Administrador: Acceso total al sistema. Puede gestionar usuarios, equipos, tiendas, reiniciar datos y acceder a todas las funciones.",
        "Administrador: Acceso al dashboard, auditorías, bitácoras con exportación Excel. No puede gestionar usuarios ni reiniciar datos.",
        "Socio Tecnológico: Acceso al dashboard y módulo de auditorías. Perfil diseñado para personal técnico externo."
    ]
    for p in profiles:
        pdf.bullet_point(p)

    # 2. Access
    pdf.add_page()
    pdf.section_title("Acceso al Sistema", "2")
    pdf.body_text("Para acceder al sistema, abra la URL de la aplicación en su navegador web. Se mostrará la pantalla de inicio de sesión.")
    pdf.subsection("Inicio de sesión")
    pdf.body_text("1. Ingrese su correo electrónico en el campo 'Correo electrónico'.")
    pdf.body_text("2. Ingrese su contraseña en el campo 'Contraseña'.")
    pdf.body_text("3. Presione el botón 'ACCEDER' para ingresar al sistema.")
    pdf.body_text("4. Puede utilizar el icono del ojo para visualizar la contraseña antes de enviarla.")
    pdf.info_box("Nota de seguridad", "La sesión expira después de 24 horas. Si experimenta problemas de acceso, contacte al Super Administrador.")

    # 3. Dashboard
    pdf.add_page()
    pdf.section_title("Panel Principal (Dashboard)", "3")
    pdf.body_text("El panel principal muestra un resumen completo de la información de activo fijo de la empresa. Al iniciar sesión, se presenta un saludo personalizado y los siguientes indicadores:")
    pdf.subsection("Indicadores KPI")
    kpis = [
        "Total Tiendas: Número total de tiendas registradas en el sistema",
        "Tiendas Auditadas: Número de tiendas que ya completaron auditoría",
        "Total Equipos: Número total de equipos de cómputo registrados",
        "Equipos Depreciados: Equipos cuya vida útil ha terminado",
        "Valor Real Total: Suma del valor real (Costo - Depreciación) de todos los equipos",
        "Auditorías Completadas: Número de auditorías finalizadas"
    ]
    for k in kpis:
        pdf.bullet_point(k)
    pdf.body_text("Los KPIs se actualizan dinámicamente al seleccionar una plaza en el filtro, mostrando solo los datos correspondientes a esa plaza.")
    pdf.subsection("Gráficas interactivas")
    pdf.body_text("El dashboard incluye gráficas de distribución de equipos por plaza (gráfica de barras) y una gráfica circular de equipos activos vs depreciados. Estas gráficas se actualizan con el filtro de plaza.")
    if stats:
        pdf.subsection("Datos actuales del sistema")
        pdf.stats_table(
            ["Métrica", "Valor"],
            [
                ["Total Tiendas", str(stats.get("total_stores", 0))],
                ["Tiendas Auditadas", str(stats.get("audited_stores", 0))],
                ["Total Equipos", str(stats.get("total_equipment", 0))],
                ["Equipos Depreciados", str(stats.get("deprecated_equipment", 0))],
                ["Valor Real Total", f"${stats.get('total_real_value', 0):,.2f}"],
            ]
        )

    # 4. Store Management
    pdf.add_page()
    pdf.section_title("Gestión de Tiendas", "4")
    pdf.body_text("En la sección inferior del dashboard se muestra el listado de tiendas. Cada tarjeta de tienda muestra:")
    pdf.bullet_point("Nombre de la tienda y CR (código de referencia)")
    pdf.bullet_point("Plaza a la que pertenece")
    pdf.bullet_point("Cantidad de equipos instalados")
    pdf.bullet_point("Estado de auditoría (Pendiente / Auditada / Incompleto)")
    pdf.subsection("Filtros y búsqueda")
    pdf.body_text("Utilice el selector 'Todas las Plazas' para filtrar tiendas por plaza. También puede escribir en el campo de búsqueda para encontrar una tienda por CR o nombre.")
    pdf.subsection("Ver equipos de una tienda")
    pdf.body_text("Al hacer clic en una tienda se abre un diálogo con dos pestañas: 'Detalles de Tienda' y 'Equipos'. La pestaña de equipos muestra la lista completa de equipos asignados a esa tienda con columnas ordenables.")

    # 5. Audit Module
    pdf.add_page()
    pdf.section_title("Módulo de Auditoría", "5")
    pdf.body_text("Para iniciar una auditoría, seleccione una tienda y presione 'Iniciar Auditoría'. Se abrirá el módulo de auditoría con:")
    pdf.bullet_point("Campo de escaneo de código de barras (compatible con hand held/lectora)")
    pdf.bullet_point("Botón de cámara para escaneo en tiempo real desde el dispositivo móvil")
    pdf.bullet_point("Contadores en tiempo real: Localizado, Sobrante, No Localizado")
    pdf.bullet_point("Botón CANCELAR para cancelar la auditoría con motivo obligatorio")
    pdf.bullet_point("Historial de escaneos con opción de eliminar registros erróneos")
    pdf.bullet_point("Lista completa de equipos de la tienda con estado de escaneo y barra horizontal")
    pdf.bullet_point("Botón de notas para agregar observaciones sobre la auditoría")
    pdf.info_box("Cancelación de auditoría", "Al cancelar una auditoría, se debe ingresar el motivo de cancelación. Este registro queda guardado en el sistema con fecha y usuario. La tienda queda disponible para nueva auditoría.")

    # 6. Barcode Scanning
    pdf.section_title("Escaneo de Códigos de Barras", "6")
    pdf.body_text("El campo de escaneo acepta entrada de teclado, escáner de códigos de barras (keyboard wedge) Y cámara del dispositivo móvil.")
    pdf.subsection("Escaneo con cámara")
    pdf.body_text("Al presionar el botón con ícono de cámara, se abre la cámara trasera del dispositivo. El sistema analiza la imagen en tiempo real y detecta automáticamente el código de barras sin necesidad de tomar foto. El código detectado se procesa de manera inmediata.")
    pdf.subsection("Clasificación automática")
    pdf.body_text("1. Si el equipo pertenece a la tienda: LOCALIZADO (verde)")
    pdf.body_text("2. Si el equipo pertenece a otra tienda: SOBRANTE (amarillo) + opción de transferencia")
    pdf.body_text("3. Si el código no existe en el sistema: SOBRANTE DESCONOCIDO (naranja) + registro como ALTA")
    pdf.body_text("4. Si el código ya fue escaneado: aviso 'Ya escaneado'")
    pdf.subsection("Registro de Sobrante Desconocido como ALTA")
    pdf.body_text("Al detectar un equipo no registrado en el MAF, el sistema abre un formulario para registrarlo manualmente con: Descripción (menú desplegable), Marca (menú desplegable) y Modelo. Este movimiento se cataloga como ALTA en la tienda auditada.")

    # 7. Classification
    pdf.add_page()
    pdf.section_title("Clasificación de Equipos", "7")
    pdf.stats_table(
        ["Clasificación", "Descripción", "Color"],
        [
            ["Localizado", "Equipo encontrado en la tienda correcta", "Verde"],
            ["Sobrante", "Equipo de otra tienda encontrado aquí", "Amarillo"],
            ["Sobrante Desconocido", "Código no registrado en el sistema", "Naranja"],
            ["No Localizado", "Equipo registrado pero no escaneado", "Rojo"],
        ]
    )

    # 8. Transfers and Disposals
    pdf.add_page()
    pdf.section_title("Transferencias y Bajas", "8")
    pdf.subsection("Transferencias")
    pdf.body_text("Cuando se escanea un equipo sobrante (perteneciente a otra tienda), se muestra un diálogo con los datos del equipo, la tienda de origen y la tienda destino (actual). El usuario puede confirmar la transferencia.")
    pdf.subsection("Solicitud de Baja")
    pdf.body_text("Al finalizar la auditoría, los equipos no localizados que estén depreciados (vida útil agotada) pueden solicitar baja. Esta opción está disponible en la pestaña 'No Localizado' del resumen de auditoría.")

    # 9. Finalize
    pdf.section_title("Finalización de Auditoría", "9")
    pdf.body_text("Al presionar 'Finalizar Auditoría' se muestra un resumen con la cantidad de equipos escaneados vs total. Los equipos no escaneados se clasifican automáticamente como 'No Localizado' y se les aplica BAJA de manera automática.")
    pdf.info_box("BAJA automática", "Todos los equipos no localizados al finalizar la auditoría reciben automáticamente un movimiento de BAJA en el sistema. Estos movimientos quedan registrados en la bitácora de movimientos.")
    pdf.info_box("Estado INCOMPLETO", "Si más del 20% de los equipos de la tienda no fueron localizados, la auditoría se marca con estatus INCOMPLETO.")
    pdf.subsection("Foto obligatoria de formatos")
    pdf.body_text("Al finalizar, si existen movimientos de ALTA/BAJA o TRANSFERENCIA, el sistema solicita captura fotográfica del formato físico correspondiente:")
    pdf.bullet_point("Una foto para movimientos de ALTA y/o BAJA (Formato AF ALTAS/BAJAS)")
    pdf.bullet_point("Una foto para movimientos de TRANSFERENCIA (Formato AF TRANSFERENCIAS)")
    pdf.body_text("El usuario puede omitir las fotos si no aplica. Las fotos quedan almacenadas como evidencia de la auditoría.")

    # 10. Logs
    pdf.add_page()
    pdf.section_title("Bitácoras y Exportación", "10")
    pdf.body_text("Las bitácoras están disponibles para perfiles Administrador y Super Administrador. Se accede desde el menú lateral 'Bitácoras'.")
    pdf.subsection("Bitácora de Clasificaciones")
    pdf.body_text("Muestra todos los equipos clasificados con fecha, código de barras, clasificación, descripción, marca, valor real y tienda. Se puede filtrar por clasificación.")
    pdf.subsection("Bitácora de Movimientos")
    pdf.body_text("Muestra ALTAS, BAJAS y TRANSFERENCIAS con fecha, tipo, datos del equipo, tienda origen/destino, y usuario.")
    pdf.body_text("Filtros disponibles: TODOS, ALTAS, BAJAS, TRANSFERENCIAS.")
    pdf.body_text("Dos botones de exportación separados:")
    pdf.bullet_point("Exportar ALTAS/BAJAS: genera SIGAF_AB_[PLAZA]_[FECHA].xlsx")
    pdf.bullet_point("Exportar Transferencias: genera SIGAF_TRANSFERENCIAS_[PLAZA]_[FECHA].xlsx")
    pdf.subsection("Formato del documento Excel")
    pdf.body_text("Los documentos incluyen: Título 'Formato de Movimiento de AF', encabezado con FECHA, DEPARTAMENTO (Sistemas) y PLAZA, seguido de la información de los equipos con columnas: Tipo de movimiento, Número de activo, Descripción, Valor Real, Modelo, Año, Número de serie, CR Tienda Origen, Tienda Origen, y para Transferencias: CR Tienda Destino y Tienda Destino.")
    pdf.subsection("Historial de Auditorías")
    pdf.body_text("Muestra todas las auditorías con fecha inicio/fin, tienda, plaza, auditor, estado (Completada/Incompleta/Cancelada/En Progreso), estadísticas y motivo de cancelación cuando aplica.")
    pdf.info_box("Importante", "La exportación respeta los filtros aplicados. Si tiene seleccionado 'ALTAS', el Excel contendrá únicamente esos registros.")

    # 11. Admin
    pdf.add_page()
    pdf.section_title("Panel de Administración", "11")
    pdf.body_text("Disponible solo para perfil Super Administrador. Permite gestionar usuarios y equipos.")
    pdf.subsection("Gestión de Usuarios")
    pdf.body_text("Crear, editar y eliminar usuarios. Al crear un usuario se asigna nombre, email, contraseña y perfil. El icono del ojo permite visualizar la contraseña.")
    pdf.subsection("Gestión de Equipos")
    pdf.body_text("Buscar y editar equipos. Se puede filtrar por plaza y buscar por código de barras, descripción, serie, etc. Los campos editables son: descripción, marca, modelo, serie, costo y depreciación.")

    # 12. Settings
    pdf.section_title("Configuración del Sistema", "12")
    pdf.body_text("Desde 'Configuración' se pueden personalizar:")
    pdf.bullet_point("Tema: Claro u Oscuro")
    pdf.bullet_point("Idioma: Español o Inglés")
    pdf.bullet_point("Paleta de colores: Profesional (azul) o Corporativo OXXO (rojo/amarillo)")

    # 13. Reset
    pdf.add_page()
    pdf.section_title("Reinicio de Datos", "13")
    pdf.body_text("Solo disponible para Super Administrador. Permite reiniciar todos los datos del sistema cargando nuevos archivos Excel.")
    pdf.body_text("Proceso:")
    pdf.body_text("1. Ir a Administración > botón 'Reiniciar Datos'")
    pdf.body_text("2. Adjuntar el archivo MAF.xlsx con los datos de equipos")
    pdf.body_text("3. Adjuntar el archivo USUARIOS.xlsx con los datos de usuarios")
    pdf.body_text("4. Presionar 'Reiniciar Datos' para confirmar")
    pdf.info_box("Advertencia", "Esta acción elimina TODOS los datos existentes (auditorías, movimientos, clasificaciones). Se puede descargar un formato/plantilla con la estructura correcta desde el mismo diálogo.")

    # 14. FAQ
    pdf.add_page()
    pdf.section_title("Preguntas Frecuentes", "14")
    faq = [
        ("¿Qué pasa si escaneo un código incorrecto?", "Puede eliminar el escaneo desde el historial presionando el ícono X junto al registro."),
        ("¿Puedo cancelar una auditoría en curso?", "Sí. Presione el botón 'Cancelar' (rojo) en la parte superior. Debe ingresar el motivo de cancelación. La tienda quedará disponible para nueva auditoría."),
        ("¿Puedo auditar la misma tienda dos veces?", "Sí. Al iniciar una nueva auditoría en una tienda ya auditada, se creará una nueva auditoría."),
        ("¿Cómo funciona el escaneo con cámara?", "Presione el ícono de cámara junto al campo de escaneo. Se abre la cámara trasera del dispositivo. Apunte al código de barras del equipo y el sistema lo detecta y procesa automáticamente en tiempo real."),
        ("¿Qué pasa si detecto un equipo desconocido?", "Se clasifica como 'Sobrante Desconocido'. Aparece el botón '+' para registrarlo manualmente con Descripción, Marca y Modelo. Se catalogará como ALTA en la tienda."),
        ("¿Qué son las fotos al finalizar la auditoría?", "Si hay movimientos de ALTA, BAJA o TRANSFERENCIA, el sistema solicita que tomes foto al formato físico de movimiento de activo. Puedes omitirlas si no aplica."),
        ("¿Cómo sé si un equipo está depreciado?", "Los equipos depreciados se marcan con etiqueta roja. Se calcula automáticamente basándose en vida útil y fecha de adquisición."),
        ("¿Qué significa estado INCOMPLETO?", "Más del 20% de los equipos de la tienda no fueron localizados durante la auditoría."),
        ("¿Puedo usar la aplicación sin internet?", "Sí, en modo limitado. Los escaneos se guardan localmente y se sincronizan automáticamente al recuperar la conexión."),
        ("¿Dónde encuentro los movimientos exportados?", "En Bitácoras > Movimientos. Use 'Exportar ALTAS/BAJAS' para el archivo SIGAF_AB y 'Exportar Transferencias' para el archivo SIGAF_TRANSFERENCIAS."),
    ]
    for q, a in faq:
        pdf.subsection(q)
        pdf.body_text(a)

    output = io.BytesIO()
    pdf.output(output)
    output.seek(0)
    return output


def generate_presentation(stats, plazas_data):
    pdf = SigafPDF("SIGAF - Presentación")
    pdf.alias_nb_pages()

    # Title slide
    pdf.title_page("SIGAF", "Sistema Integral de Gestión de Activo Fijo", "Propuesta de Proyecto")

    # Problem
    pdf.add_page()
    pdf.section_title("Problemática", "1")
    pdf.body_text("La gestión de activos fijos de cómputo en cadenas de tiendas de conveniencia presenta desafíos significativos:")
    problems = [
        "Control manual de inventario propenso a errores y pérdida de información",
        "Dificultad para rastrear equipos entre múltiples tiendas y plazas",
        "Falta de visibilidad en tiempo real del estado de los activos",
        "Procesos de auditoría lentos y dependientes de formatos físicos",
        "Imposibilidad de identificar equipos faltantes, sobrantes o depreciados de forma eficiente",
        "Ausencia de métricas y reportes para la toma de decisiones"
    ]
    for p in problems:
        pdf.bullet_point(p)

    # Solution
    pdf.add_page()
    pdf.section_title("Solución: SIGAF", "2")
    pdf.body_text("SIGAF es una plataforma web integral diseñada específicamente para la gestión y auditoría de activos fijos de cómputo en tiendas de conveniencia.")
    pdf.subsection("Propuesta de valor")
    values = [
        "Digitalización completa del proceso de auditoría de inventario",
        "Escaneo de códigos de barras en tiempo real con dispositivos hand held",
        "Clasificación automática de equipos (Localizado/Sobrante/No Localizado)",
        "Gestión de transferencias entre tiendas y solicitudes de baja",
        "Dashboard con KPIs e indicadores visuales para toma de decisiones",
        "Exportación de reportes a Excel para documentación",
        "Control de acceso por roles (Super Admin, Admin, Socio Tecnológico)"
    ]
    for v in values:
        pdf.bullet_point(v)

    # Architecture
    pdf.add_page()
    pdf.section_title("Arquitectura Técnica", "3")
    pdf.subsection("Stack tecnológico")
    pdf.stats_table(
        ["Componente", "Tecnología", "Función"],
        [
            ["Frontend", "React + Tailwind CSS", "Interfaz de usuario responsive"],
            ["Backend", "FastAPI (Python)", "API REST y lógica de negocio"],
            ["Base de datos", "MongoDB", "Almacenamiento de datos"],
            ["Autenticación", "JWT + bcrypt", "Control de acceso seguro"],
            ["Exportación", "OpenPyXL", "Generación de archivos Excel"],
        ]
    )
    pdf.ln(5)
    pdf.subsection("Características de la plataforma")
    arch_features = [
        "Aplicación web responsive: Compatible con hand held, tablet y PC",
        "Interfaz bilingüe: Español e Inglés con cambio instantáneo",
        "Temas visuales: Modo claro/oscuro con paletas intercambiables",
        "Rendimiento: Optimizada para manejar +30,000 registros de equipos",
        "Seguridad: Tokens JWT con expiración, contraseñas hasheadas con bcrypt"
    ]
    for f in arch_features:
        pdf.bullet_point(f)

    # Current Data
    if stats:
        pdf.add_page()
        pdf.section_title("Datos del Sistema", "4")
        pdf.subsection("Resumen general")
        pdf.stats_table(
            ["Indicador", "Valor"],
            [
                ["Total de tiendas", f"{stats.get('total_stores', 0):,}"],
                ["Total de equipos", f"{stats.get('total_equipment', 0):,}"],
                ["Equipos activos", f"{stats.get('active_equipment', 0):,}"],
                ["Equipos depreciados", f"{stats.get('deprecated_equipment', 0):,}"],
                ["Costo total registrado", f"${stats.get('total_cost', 0):,.2f}"],
                ["Valor real total", f"${stats.get('total_real_value', 0):,.2f}"],
                ["Auditorías completadas", f"{stats.get('completed_audits', 0)}"],
                ["Tiendas auditadas", f"{stats.get('audited_stores', 0)}"],
            ]
        )
        if stats.get("equipment_by_plaza"):
            pdf.ln(5)
            pdf.subsection("Distribución por plaza")
            plaza_rows = [[plaza, f"{count:,}"] for plaza, count in stats["equipment_by_plaza"].items()]
            pdf.stats_table(["Plaza", "Equipos"], plaza_rows)

    # Features detail
    pdf.add_page()
    pdf.section_title("Módulos del Sistema", "5")
    modules = [
        ("Dashboard", "Panel principal con KPIs dinámicos, gráficas interactivas de distribución por plaza y estado de depreciación. Los indicadores se actualizan al filtrar por plaza."),
        ("Gestión de Tiendas", "Listado de tiendas con filtro por plaza, búsqueda por CR o nombre, vista detallada de equipos por tienda con columnas ordenables."),
        ("Módulo de Auditoría", "Escaneo de códigos de barras en tiempo real con clasificación automática. Contadores en vivo, historial de escaneos con opción de eliminación, notas de auditoría."),
        ("Transferencias y Bajas", "Gestión de movimientos de equipos: transferencias entre tiendas y solicitudes de baja para equipos depreciados no localizados."),
        ("Bitácoras", "Registro detallado de clasificaciones, movimientos y auditorías. Filtros por tipo y exportación a Excel respetando los filtros aplicados."),
        ("Administración", "Gestión de usuarios (CRUD), edición de equipos, y reinicio de datos del sistema con carga de nuevos archivos Excel."),
        ("Configuración", "Personalización de tema (claro/oscuro), idioma (ES/EN), y paleta de colores (Profesional/OXXO).")
    ]
    for title, desc in modules:
        pdf.subsection(title)
        pdf.body_text(desc)

    # Benefits
    pdf.add_page()
    pdf.section_title("Beneficios", "6")
    benefits = [
        ("Eficiencia operativa", "Reducción significativa del tiempo de auditoría gracias al escaneo digital y clasificación automática de equipos."),
        ("Visibilidad en tiempo real", "Dashboard con KPIs actualizados que permiten tomar decisiones informadas sobre la gestión de activos."),
        ("Trazabilidad", "Registro completo de cada auditoría, clasificación y movimiento con fecha, usuario y datos del equipo."),
        ("Control financiero", "Cálculo automático de valor real, identificación de equipos depreciados y cuantificación del valor de faltantes."),
        ("Reducción de errores", "Eliminación de procesos manuales y formatos físicos propensos a errores."),
        ("Escalabilidad", "Arquitectura preparada para crecer con la cadena de tiendas y volumen de equipos."),
    ]
    for title, desc in benefits:
        pdf.subsection(title)
        pdf.body_text(desc)

    # Next Steps
    pdf.add_page()
    pdf.section_title("Siguientes Pasos", "7")
    steps = [
        "Despliegue en servidor de producción para uso operativo",
        "Capacitación de auditores y administradores en el uso del sistema",
        "Piloto inicial en un grupo de tiendas para validación",
        "Implementación de modo offline para zonas con conectividad limitada",
        "Integración con sistemas ERP existentes",
        "Módulo de reportes avanzados con gráficas exportables a PDF"
    ]
    for i, s in enumerate(steps, 1):
        pdf.body_text(f"{i}. {s}")

    pdf.ln(10)
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(30, 60, 120)
    pdf.cell(0, 10, safe_text("Gracias por su atencion!"), align="C")

    output = io.BytesIO()
    pdf.output(output)
    output.seek(0)
    return output
