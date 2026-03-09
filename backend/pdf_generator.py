from fpdf import FPDF
import os, io
from datetime import datetime

# ── Brand Colors ──────────────────────────────────────────────
NAVY    = (30,  60, 120)
BLUE    = (52, 120, 210)
GREEN   = (22, 163,  74)
AMBER   = (217, 119,  6)
RED     = (220,  38,  38)
ORANGE  = (234, 88,  12)
GRAY    = (100, 100, 100)
LGRAY   = (240, 242, 247)
WHITE   = (255, 255, 255)
DARK    = ( 30,  30,  40)

def safe(text):
    text = str(text)
    replacements = {
        '\u2022':'-','\u2013':'-','\u2014':'-','\u2018':"'",'\u2019':"'",
        '\u201c':'"','\u201d':'"','\u2026':'...','\u00b7':'-',
        '\u00e1':'a','\u00e9':'e','\u00ed':'i','\u00f3':'o','\u00fa':'u',
        '\u00c1':'A','\u00c9':'E','\u00cd':'I','\u00d3':'O','\u00da':'U',
        '\u00f1':'n','\u00d1':'N','\u00fc':'u','\u00e0':'a',
        '\u00e2':'a','\u00ea':'e','\u00ee':'i','\u00f4':'o','\u00fb':'u',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
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
        self.set_auto_page_break(auto=True, margin=22)

    def header(self):
        self.set_fill_color(*NAVY)
        self.rect(0, 0, 210, 5, 'F')
        self.set_y(8)
        self.set_font("Helvetica", "B", 8.5)
        self.set_text_color(*NAVY)
        self.cell(120, 5, safe(self.doc_title), align="L")
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*GRAY)
        self.cell(0, 5, datetime.now().strftime("%d/%m/%Y"), align="R", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(200, 210, 230)
        self.set_line_width(0.3)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(3)

    def footer(self):
        self.set_y(-13)
        self.set_draw_color(200, 210, 230)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(1)
        self.set_font("Helvetica", "", 7.5)
        self.set_text_color(*GRAY)
        self.cell(0, 6, safe("SIGAF - Sistema Integral de Gestion de Activo Fijo  |  Pagina " + str(self.page_no()) + "/{nb}"), align="C")

    def cover(self, title, subtitle, doc_type=""):
        self.add_page()
        self.set_fill_color(*NAVY)
        self.rect(0, 0, 210, 75, 'F')
        self.set_y(20)
        self.set_font("Helvetica", "B", 38)
        self.set_text_color(*WHITE)
        self.cell(210, 16, "SIGAF", align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 11)
        self.set_text_color(180, 200, 240)
        self.cell(210, 7, safe("Sistema Integral de Gestion de Activo Fijo"), align="C", new_x="LMARGIN", new_y="NEXT")
        # Card
        self.set_fill_color(*WHITE)
        self.set_draw_color(*BLUE)
        self.set_line_width(0.5)
        self.rect(25, 82, 160, 55, 'FD')
        self.set_y(95)
        self.set_font("Helvetica", "B", 20)
        self.set_text_color(*NAVY)
        self.cell(210, 11, safe(title), align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 11)
        self.set_text_color(*GRAY)
        self.cell(210, 8, safe(subtitle), align="C", new_x="LMARGIN", new_y="NEXT")
        if doc_type:
            self.set_font("Helvetica", "B", 9.5)
            self.set_text_color(*BLUE)
            self.cell(210, 7, safe(doc_type), align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_y(148)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*GRAY)
        self.cell(210, 6, safe(datetime.now().strftime("Generado: %d de %B de %Y")), align="C")
        self.set_fill_color(*LGRAY)
        self.rect(0, 274, 210, 23, 'F')
        self.set_y(279)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*GRAY)
        self.cell(210, 5, safe("OXXO - Direccion de Sistemas  |  Confidencial"), align="C")

    def section_title(self, title, num=""):
        if self.get_y() > 250:
            self.add_page()
        self.ln(4)
        self.set_fill_color(*NAVY)
        y = self.get_y()
        self.rect(10, y, 3, 10, 'F')
        self.set_xy(16, y)
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(*NAVY)
        txt = safe(f"{num}. {title}" if num else title)
        self.cell(0, 10, txt, new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(*BLUE)
        self.set_line_width(0.25)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(3)

    def subsection(self, title):
        if self.get_y() > 258:
            self.add_page()
        self.ln(2)
        self.set_font("Helvetica", "B", 10.5)
        self.set_text_color(*DARK)
        self.set_x(10)
        self.cell(0, 7, safe(title), new_x="LMARGIN", new_y="NEXT")
        self.ln(0.5)

    def body(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*DARK)
        self.set_x(10)
        self.multi_cell(0, 5.5, safe(text))
        self.ln(1.5)

    def bullet(self, text, indent=6, color=NAVY):
        if self.get_y() > 265:
            self.add_page()
        self.set_font("Helvetica", "", 10)
        lm = self.l_margin
        self.set_left_margin(lm + indent)
        self.set_x(lm + indent)
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(*color)
        self.cell(5, 5.5, safe("->"))
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*DARK)
        self.multi_cell(0, 5.5, safe(" " + text))
        self.set_left_margin(lm)
        self.ln(0.3)

    def note_box(self, title, text, color=BLUE, bg=(235, 242, 255)):
        self.ln(2)
        y = self.get_y()
        if y > 252:
            self.add_page()
            y = self.get_y()
        lines = max(1, len(text) // 80 + text.count('\n') + 1)
        total_h = 8 + lines * 5.5 + 6
        self.set_fill_color(*bg)
        self.set_draw_color(*color)
        self.set_line_width(0.4)
        self.rect(10, y, 190, total_h, 'FD')
        self.set_fill_color(*color)
        self.rect(10, y, 3.5, total_h, 'F')
        self.set_xy(17, y + 2)
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*color)
        self.cell(0, 6, safe(title), new_x="LMARGIN", new_y="NEXT")
        self.set_x(17)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*DARK)
        self.multi_cell(178, 5.5, safe(text))
        self.set_y(y + total_h + 3)

    def table(self, headers, rows, col_widths=None, alternating=True):
        n = len(headers)
        if not col_widths:
            col_widths = [190 / n] * n
        if self.get_y() > 250:
            self.add_page()
        self.set_font("Helvetica", "B", 8.5)
        self.set_fill_color(*NAVY)
        self.set_text_color(*WHITE)
        self.set_draw_color(200, 210, 230)
        self.set_line_width(0.2)
        for h, w in zip(headers, col_widths):
            self.cell(w, 8, safe(str(h)), border=1, fill=True, align="C")
        self.ln()
        self.set_font("Helvetica", "", 8.5)
        self.set_text_color(*DARK)
        for i, row in enumerate(rows):
            if self.get_y() > 262:
                self.add_page()
                self.set_font("Helvetica", "B", 8.5)
                self.set_fill_color(*NAVY)
                self.set_text_color(*WHITE)
                for h, w in zip(headers, col_widths):
                    self.cell(w, 8, safe(str(h)), border=1, fill=True, align="C")
                self.ln()
                self.set_font("Helvetica", "", 8.5)
                self.set_text_color(*DARK)
            fill = alternating and (i % 2 == 0)
            self.set_fill_color(*(LGRAY if fill else WHITE))
            for val, w in zip(row, col_widths):
                self.cell(w, 7, safe(str(val)), border=1, fill=fill, align="C")
            self.ln()
        self.ln(3)

    def kpi_row(self, items):
        n = len(items)
        w = 190 / n
        y = self.get_y()
        if y > 250:
            self.add_page()
            y = self.get_y()
        self.set_x(10)
        for label, value, color in items:
            x = self.get_x()
            self.set_fill_color(*LGRAY)
            self.set_draw_color(*color)
            self.set_line_width(0.4)
            self.rect(x, y, w - 3, 22, 'FD')
            self.set_fill_color(*color)
            self.rect(x, y, w - 3, 2.5, 'F')
            self.set_xy(x, y + 4)
            self.set_font("Helvetica", "B", 14)
            self.set_text_color(*color)
            self.cell(w - 3, 8, safe(str(value)), align="C", new_x="RIGHT", new_y="TOP")
            self.set_xy(x, y + 13)
            self.set_font("Helvetica", "", 7)
            self.set_text_color(*GRAY)
            self.cell(w - 3, 5, safe(label.upper()), align="C", new_x="RIGHT", new_y="TOP")
            self.set_x(x + w)
        self.set_y(y + 26)
        self.ln(2)

    def screen_mock(self, title, elements, width=190, height=None):
        if height is None:
            height = 10 + len(elements) * 7 + 8
        if self.get_y() + height > 268:
            self.add_page()
        y = self.get_y()
        x = 10
        # Browser chrome
        self.set_fill_color(*DARK)
        self.rect(x, y, width, 9, 'F')
        for dx, col in [(5,(255,90,80)),(11,(255,190,50)),(17,(50,200,80))]:
            self.set_fill_color(*col)
            self.ellipse(x+dx, y+3, 3, 3, 'F')
        self.set_fill_color(55, 60, 75)
        self.rect(x+25, y+2, 115, 5, 'F')
        self.set_font("Helvetica", "", 5.5)
        self.set_text_color(170, 180, 200)
        self.set_xy(x+27, y+3)
        self.cell(111, 3, safe("insightful-caring-production-2702.up.railway.app"), align="L")
        # App nav bar
        self.set_fill_color(*NAVY)
        self.rect(x, y+9, width, 10, 'F')
        self.set_font("Helvetica", "B", 7.5)
        self.set_text_color(*WHITE)
        self.set_xy(x+3, y+11)
        self.cell(60, 6, safe(title), align="L")
        # Content
        self.set_fill_color(*WHITE)
        self.rect(x, y+19, width, height-19, 'F')
        self.set_draw_color(200, 210, 230)
        self.set_line_width(0.3)
        self.rect(x, y, width, height, 'D')
        ey = y + 22
        for elem in elements:
            if ey > y + height - 4:
                break
            kind = elem.get("type","text")
            if kind == "text":
                self.set_font("Helvetica", elem.get("style",""), elem.get("size",8))
                self.set_text_color(*elem.get("color", DARK))
                self.set_xy(x + elem.get("x",4), ey)
                self.cell(width-8, 5, safe(elem.get("text","")), align=elem.get("align","L"))
                ey += elem.get("dy", 6)
            elif kind == "badge":
                bx = x + elem.get("x", 4)
                col = elem.get("color", GREEN)
                self.set_fill_color(*col)
                self.set_text_color(*WHITE)
                self.set_font("Helvetica", "B", 6.5)
                self.rect(bx, ey-0.5, elem.get("w",28), 5.5, 'F')
                self.set_xy(bx, ey-0.5)
                self.cell(elem.get("w",28), 5.5, safe(elem.get("text","")), align="C")
                ey += elem.get("dy", 7)
            elif kind == "divider":
                self.set_draw_color(220, 225, 235)
                self.set_line_width(0.2)
                self.line(x+3, ey, x+width-3, ey)
                ey += elem.get("dy", 4)
            elif kind == "bar":
                bw = elem.get("w", 140)
                bh = 4
                bx = x + elem.get("x", 4)
                self.set_fill_color(220, 225, 235)
                self.rect(bx, ey, bw, bh, 'F')
                self.set_fill_color(*elem.get("color", BLUE))
                self.rect(bx, ey, bw * elem.get("pct", 0.5), bh, 'F')
                ey += bh + elem.get("dy", 5)
            elif kind == "kpirow":
                vals = elem.get("values",[])
                kw = (width-10) / max(len(vals),1)
                for label, val, kcol in vals:
                    kidx = vals.index((label, val, kcol))
                    kx = x + 5 + kidx * kw
                    self.set_fill_color(*LGRAY)
                    self.rect(kx, ey, kw-2, 15, 'F')
                    self.set_fill_color(*kcol)
                    self.rect(kx, ey, kw-2, 1.5, 'F')
                    self.set_font("Helvetica","B",8.5)
                    self.set_text_color(*kcol)
                    self.set_xy(kx, ey+2)
                    self.cell(kw-2, 6, safe(str(val)), align="C")
                    self.set_font("Helvetica","",5.5)
                    self.set_text_color(*GRAY)
                    self.set_xy(kx, ey+9)
                    self.cell(kw-2, 4, safe(label.upper()), align="C")
                ey += 19
        self.set_y(y + height + 4)


# ═══════════════════════════════════════════════════════════════
#  MANUAL DE USUARIO
# ═══════════════════════════════════════════════════════════════

def generate_user_manual(stats, plazas_data, user_perfil="Super Administrador"):
    # Normalizar perfil
    perfil = user_perfil or "Administrador"
    is_super = perfil == "Super Administrador"
    is_admin = perfil in ("Super Administrador", "Administrador")
    is_socio = perfil == "Socio Tecnologico"

    pdf = SigafPDF(f"SIGAF - Manual de Usuario ({perfil})")
    pdf.alias_nb_pages()

    cover_subtitle = "Guia completa del sistema SIGAF"
    if is_socio:
        cover_subtitle = "Guia para Socio Tecnologico"
    elif perfil == "Administrador":
        cover_subtitle = "Guia para Administrador"

    pdf.cover("Manual de Usuario", cover_subtitle, f"Perfil: {perfil}  |  v2.0 - Marzo 2026")

    # Tabla de contenido adaptada al perfil
    pdf.add_page()
    pdf.section_title("Contenido")
    toc_all = [
        ("1","Introduccion al Sistema"),
        ("2","Acceso al Sistema"),
        ("3","Panel Principal (Dashboard)"),
        ("4","Gestion de Tiendas"),
        ("5","Modulo de Auditoria (Inventario)"),
        ("5.1","  Iniciar Auditoria"),
        ("5.2","  Escaneo de Codigos de Barras con Zebra TC52"),
        ("5.3","  Clasificacion Automatica de Equipos"),
        ("5.4","  Registro de Sobrante Desconocido (ALTA)"),
        ("5.5","  Transferencias entre Tiendas"),
        ("5.6","  Finalizar Auditoria y Foto de Formatos"),
        ("5.7","  Resumen de Auditoria Completada"),
    ]
    if is_admin:
        toc_all += [
            ("6","Bitacoras y Exportacion"),
            ("6.1","  Clasificaciones de Equipos"),
            ("6.2","  Movimientos (ALTAS, BAJAS, TRANSFERENCIAS)"),
            ("6.3","  Historial de Auditorias"),
        ]
    if is_super:
        toc_all += [
            ("7","Panel de Administracion"),
            ("7.1","  Gestion de Usuarios"),
            ("7.2","  Gestion de Equipos"),
            ("7.3","  Reinicio de Datos"),
        ]
    toc_all += [
        ("8" if is_super else ("7" if is_admin else "6"),"Configuracion del Sistema"),
        ("9" if is_super else ("8" if is_admin else "7"),"Preguntas Frecuentes"),
    ]
    for num, item in toc_all:
        pdf.set_font("Helvetica","",10)
        pdf.set_text_color(*DARK)
        pdf.set_x(14)
        pdf.cell(14,6,safe(num),align="L")
        pdf.cell(0,6,safe(item),new_x="LMARGIN",new_y="NEXT")

    # ── 1. Introducción ──
    pdf.add_page()
    pdf.section_title("Introduccion al Sistema","1")
    pdf.body("SIGAF (Sistema Integral de Gestion de Activo Fijo) es una plataforma web desarrollada para OXXO orientada a la realizacion de auditorias de inventario de equipo de computo en tiendas de conveniencia.")

    if is_socio:
        pdf.body("Como Socio Tecnologico, su rol principal es realizar auditorias de inventario en las tiendas asignadas usando el dispositivo Zebra TC52. Este manual cubre unicamente las funciones disponibles para su perfil.")
        pdf.note_box("Funciones disponibles para Socio Tecnologico",
            "Panel Principal (Dashboard), Gestion de Tiendas (consulta), Modulo de Auditoria completo, Configuracion del sistema.",
            GREEN, (230, 255, 235))
    elif perfil == "Administrador":
        pdf.body("Como Administrador, tiene acceso al modulo de auditoria, bitacoras y exportacion de reportes Excel. Este manual cubre todas las funciones disponibles para su perfil.")
        pdf.note_box("Funciones disponibles para Administrador",
            "Panel Principal, Gestion de Tiendas, Modulo de Auditoria completo, Bitacoras (Clasificaciones, Movimientos, Historial de Auditorias), Exportacion Excel, Configuracion.",
            BLUE, (230, 238, 255))
    else:
        pdf.body("Como Super Administrador, tiene acceso total al sistema incluyendo gestion de usuarios, equipos y reinicio de datos.")
        pdf.note_box("Acceso total - Super Administrador",
            "Todas las funciones del sistema: Panel, Auditoria, Bitacoras, Administracion de usuarios y equipos, Reinicio de datos, Configuracion.",
            NAVY, (230, 235, 255))

    pdf.subsection("Perfiles de usuario del sistema")
    pdf.table(
        ["Perfil","Acceso a..."],
        [
            ["Super Administrador","Todo el sistema: Dashboard, Auditoria, Bitacoras, Administracion, Configuracion"],
            ["Administrador","Dashboard, Auditoria, Bitacoras con exportacion Excel, Configuracion"],
            ["Socio Tecnologico","Dashboard (consulta) y Modulo de Auditoria, Configuracion"],
        ],[48,142]
    )

    pdf.subsection("Caracteristicas del sistema v2.0")
    features_all = [
        ("all","Dashboard con 6 KPIs dinamicos filtrados por plaza en tiempo real"),
        ("all","Tarjetas de tienda con estado: Pendiente / En Progreso / Auditada"),
        ("all","Escaneo de codigos de barras con Zebra TC52 via DataWedge"),
        ("all","Clasificacion automatica: Localizado, Sobrante, Sobrante Desconocido, No Localizado"),
        ("all","Campo de Numero de Serie en registro de Sobrante Desconocido"),
        ("all","Foto obligatoria de formatos fisicos al finalizar (ALTA/BAJA y Transferencias)"),
        ("all","Resumen interactivo: clic en tarjetas para filtrar detalle por grupo"),
        ("all","Tabla de equipos con columnas Serie y Depreciado"),
        ("admin","Exportacion Excel con hoja adicional de imagenes de formatos"),
        ("admin","Bitacoras con columnas Serie y Depreciado"),
        ("admin","Descarga individual de fotos de formatos desde historial de auditorias"),
        ("admin","Reporte PDF ejecutivo de una pagina por auditoria"),
        ("super","Gestion de usuarios (crear, editar, eliminar)"),
        ("super","Gestion y edicion de equipos"),
        ("super","Reinicio de datos del sistema (carga de nuevos MAF)"),
        ("all","Temas: Claro/Oscuro | Paletas: Profesional / Corporativo OXXO"),
        ("all","Interfaz bilingue Espanol / Ingles"),
    ]
    for scope, f in features_all:
        if scope == "all" or (scope == "admin" and is_admin) or (scope == "super" and is_super):
            pdf.bullet(f)

    # ── 2. Acceso ──
    pdf.add_page()
    pdf.section_title("Acceso al Sistema","2")
    pdf.body("Abra Chrome en el dispositivo e ingrese la URL:")
    pdf.note_box("URL del sistema","https://insightful-caring-production-2702.up.railway.app",NAVY,(230,238,255))

    pdf.screen_mock("SIGAF - Inicio de Sesion",[
        {"type":"text","text":"","dy":4},
        {"type":"text","text":"Correo electronico","size":7.5,"color":GRAY,"x":50,"dy":5},
        {"type":"text","text":"[ usuario@oxxo.com          ]","size":8,"color":DARK,"x":50,"dy":6},
        {"type":"text","text":"Contrasena","size":7.5,"color":GRAY,"x":50,"dy":5},
        {"type":"text","text":"[ ******************       ]","size":8,"color":DARK,"x":50,"dy":8},
        {"type":"badge","text":"        ACCEDER        ","color":NAVY,"x":60,"w":70,"dy":6},
    ], height=60)

    pdf.note_box("Sesion","La sesion permanece activa 24 horas. Si olvida su contrasena contacte al Super Administrador.", AMBER,(255,248,230))

    pdf.subsection("Instalacion como PWA en Zebra TC52")
    for i,s in enumerate([
        "Abra la URL en Chrome del Zebra TC52",
        "Toque el menu de Chrome (tres puntos, esquina superior derecha)",
        "Seleccione 'Agregar a pantalla de inicio'",
        "Confirme el nombre 'SIGAF' y toque 'Agregar'",
        "El icono aparecera en la pantalla principal del dispositivo",
    ],1):
        pdf.bullet(f"{i}. {s}")

    # ── 3. Panel Principal ──
    pdf.add_page()
    pdf.section_title("Panel Principal (Dashboard)","3")
    pdf.body("Es la pantalla de inicio. Muestra un saludo personalizado, 6 KPIs, graficas y el listado de tiendas.")

    if stats:
        pdf.kpi_row([
            ("Total Tiendas", str(stats.get("total_stores",0)), NAVY),
            ("Auditadas", str(stats.get("audited_stores",0)), GREEN),
            ("Total Equipos", f"{stats.get('total_equipment',0):,}", BLUE),
            ("Depreciados", str(stats.get("deprecated_equipment",0)), AMBER),
        ])

    pdf.screen_mock("Panel Principal - SIGAF",[
        {"type":"text","text":"Bienvenido, Benjamin Ruiz","size":7.5,"color":GRAY,"dy":5},
        {"type":"kpirow","values":[
            ("Tiendas","1,010",NAVY),
            ("Auditadas","124",GREEN),
            ("Equipos","28,430",BLUE),
            ("Deprec.","3,211",AMBER),
        ]},
        {"type":"text","text":"RESUMEN DE TIENDAS (1,010)","size":7.5,"style":"B","color":NAVY,"dy":5},
        {"type":"divider","dy":3},
        {"type":"text","text":"10TIJ Ensenada  CR:32UHH                              Pendiente","size":7,"color":DARK,"dy":5},
        {"type":"text","text":"ARIAS TIJ  CR:50REP                                    Auditada","size":7,"color":GREEN,"dy":5},
        {"type":"text","text":"Abelardo TIJ  CR:50SYP                               En Progreso","size":7,"color":BLUE,"dy":5},
    ], height=82)

    pdf.subsection("Estados de auditoria de tienda")
    pdf.table(
        ["Estado","Color","Significado"],
        [
            ["Pendiente","Gris","La tienda no ha sido auditada en el ciclo actual"],
            ["En Progreso","Azul","Hay una auditoria activa en este momento"],
            ["Auditada","Verde","La auditoria fue completada exitosamente"],
        ],[38,30,122]
    )
    pdf.bullet("Plaza: filtra tarjetas de tiendas y todos los KPIs por plaza")
    pdf.bullet("Busqueda: filtra tiendas por CR o nombre en tiempo real")

    # ── 4. Gestión de tiendas ──
    pdf.add_page()
    pdf.section_title("Gestion de Tiendas","4")
    pdf.body("Al hacer clic en una tarjeta de tienda se abre un dialogo con informacion detallada:")
    pdf.screen_mock("Dialogo de Tienda - Equipos",[
        {"type":"text","text":"ABELARDO TIJ","size":9,"style":"B","color":NAVY,"dy":7},
        {"type":"text","text":"CR: 50SYP  |  Ensenada  |  35 equipos","size":7.5,"color":GRAY,"dy":7},
        {"type":"text","text":"[ Detalles de Tienda ]  [ Equipos ]  <-- pestanas","size":7.5,"color":BLUE,"dy":7},
        {"type":"divider","dy":3},
        {"type":"text","text":"Cod.Barras  Descripcion      Marca   Modelo   Serie       Valor     Dep.","size":6.5,"color":GRAY,"dy":5},
        {"type":"text","text":"84847618    ACCESS POINT     CISCO   WAP361   SN-34F21   $4,200    No","size":6.5,"color":DARK,"dy":5},
        {"type":"text","text":"63745231    ESCANER-LECTOR   DATALO  DS9308   SN-X8812   $1,800    Si","size":6.5,"color":DARK,"dy":5},
        {"type":"badge","text":" Iniciar Auditoria ","color":NAVY,"x":5,"w":65,"dy":5},
    ], height=76)
    pdf.note_box("Scroll horizontal","En moviles la tabla incluye scroll horizontal para ver todas las columnas: Codigo, Descripcion, Marca, Modelo, Serie, Valor Real, Depreciado.",BLUE)

    # ── 5. Módulo de Auditoría ──
    pdf.add_page()
    pdf.section_title("Modulo de Auditoria (Inventario)","5")
    pdf.body("Nucleo del sistema. Permite realizar el inventario fisico completo de una tienda.")

    pdf.subsection("5.1  Iniciar Auditoria")
    pdf.body("En el dialogo de tienda presione 'Iniciar Auditoria'. La tarjeta de la tienda cambia a 'En Progreso' (azul).")
    pdf.bullet("Si ya existe una auditoria en progreso para esa tienda, el sistema la retoma automaticamente")
    pdf.bullet("Solo puede haber una auditoria activa por tienda a la vez")

    pdf.screen_mock("Modulo de Auditoria en Progreso",[
        {"type":"text","text":"ABELARDO TIJ  |  CR:50SYP  |  35 equipos en MAF","size":7.5,"style":"B","color":NAVY,"dy":6},
        {"type":"kpirow","values":[
            ("Localizado","28",GREEN),
            ("Sobrante","2",AMBER),
            ("No Local.","5",RED),
        ]},
        {"type":"text","text":"[ Escanear codigo de barras: __________________________ ]  [Escanear]","size":7.5,"color":DARK,"dy":7},
        {"type":"bar","pct":0.86,"color":GREEN,"w":160,"x":10,"dy":6},
        {"type":"text","text":"Progreso: 30 de 35 escaneados (86%)","size":7,"color":GRAY,"dy":6},
        {"type":"divider","dy":3},
        {"type":"text","text":"Ultimo: 84847784  HAND HELD ZEBRA TC52  -> LOCALIZADO","size":7,"color":GREEN,"dy":5},
    ], height=82)

    pdf.subsection("5.2  Escaneo de Codigos de Barras con Zebra TC52")
    pdf.table(
        ["Metodo","Como usarlo","Velocidad"],
        [
            ["Zebra TC52 (DataWedge)","Enfoque el campo y presione el gatillo del lector fisico.","< 0.5 seg"],
            ["Entrada manual","Escriba el codigo en el campo y presione Enter.","Manual"],
        ],[52,98,40]
    )
    pdf.note_box("DataWedge","El Zebra TC52 viene preconfigurado para salida por teclado. Solo asegurese de que el campo de escaneo tenga el foco antes de escanear.", NAVY)

    pdf.add_page()
    pdf.subsection("5.3  Clasificacion Automatica de Equipos")
    pdf.table(
        ["Clasificacion","Condicion","Color","Accion"],
        [
            ["LOCALIZADO","El equipo pertenece a esta tienda","Verde","Se registra como encontrado"],
            ["SOBRANTE","El equipo pertenece a otra tienda","Amarillo","Dialogo de confirmacion de transferencia"],
            ["SOBRANTE DESCONOCIDO","Codigo no existe en el MAF","Naranja","Formulario de registro como ALTA"],
            ["NO LOCALIZADO","No escaneado al finalizar","Rojo","BAJA automatica al finalizar"],
        ],[40,52,25,73]
    )

    pdf.subsection("5.4  Registro de Sobrante Desconocido como ALTA")
    pdf.screen_mock("Sobrante Desconocido - Registrar ALTA",[
        {"type":"text","text":"Sobrante Desconocido - Registrar ALTA","size":8,"style":"B","color":ORANGE,"dy":7},
        {"type":"text","text":"Codigo detectado: NEW-00001","size":7.5,"color":DARK,"dy":6},
        {"type":"text","text":"Descripcion: [ ACCESS POINT          v ]   Marca: [ CISCO  v ]","size":7.5,"color":DARK,"dy":6},
        {"type":"text","text":"Modelo:      [ WAP361                  ]   Serie: [ SN-001  ] (opcional)","size":7.5,"color":DARK,"dy":7},
        {"type":"badge","text":" Registrar como ALTA ","color":NAVY,"x":50,"w":90,"dy":6},
    ], height=62)
    pdf.bullet("Al confirmar: el equipo se agrega al MAF y se genera movimiento de ALTA")
    pdf.bullet("El numero de serie queda registrado para trazabilidad")

    pdf.subsection("5.5  Transferencias entre Tiendas")
    pdf.body("Al detectar un equipo SOBRANTE (de otra tienda): se muestra dialogo con datos del equipo, tienda origen y tienda destino. Al confirmar se genera movimiento de TRANSFERENCIA.")

    pdf.subsection("5.6  Finalizar Auditoria y Foto de Formatos")
    pdf.body("Al presionar 'Finalizar Auditoria':")
    pdf.bullet("Equipos no escaneados se clasifican como NO LOCALIZADO automaticamente")
    pdf.bullet("Se aplica BAJA automatica a todos los no localizados")
    pdf.bullet("Aparece pantalla de espera 'Procesando auditoria...' — NO cierre la ventana")
    pdf.bullet("Si hay movimientos, se solicita foto del formato fisico firmado")
    pdf.screen_mock("Foto de Formatos - Al Finalizar",[
        {"type":"text","text":"Foto de Formato de Movimiento de Activo","size":8,"style":"B","color":NAVY,"dy":7},
        {"type":"text","text":"[ Formato ALTAS / BAJAS ]   [ Abrir Camara ]  [ Capturado OK ]","size":7.5,"color":DARK,"dy":7},
        {"type":"text","text":"[ Formato TRANSFERENCIAS ]  [ Abrir Camara ]  [ Sin captura ]","size":7.5,"color":DARK,"dy":7},
        {"type":"badge","text":" Guardar Fotos y Finalizar ","color":NAVY,"x":30,"w":130,"dy":6},
    ], height=54)

    pdf.add_page()
    pdf.subsection("5.7  Resumen de Auditoria Completada")
    pdf.screen_mock("Resumen Post-Auditoria",[
        {"type":"text","text":"ABELARDO TIJ  |  Completada  |  08/03/26","size":8,"style":"B","color":NAVY,"dy":6},
        {"type":"kpirow","values":[
            ("Equipos","35",NAVY),
            ("Localizado","30",GREEN),
            ("Sobrante","2",AMBER),
            ("No Local.","3",RED),
        ]},
        {"type":"text","text":"<-- Haga clic en las tarjetas para filtrar el detalle -->","size":7,"color":GRAY,"dy":5},
        {"type":"divider","dy":3},
        {"type":"text","text":"NO LOCALIZADO (3):","size":7.5,"style":"B","color":RED,"dy":5},
        {"type":"text","text":"Cod.Barras  Descripcion   Marca  Modelo  Serie    Valor    Dep.","size":6.5,"color":GRAY,"dy":4},
        {"type":"text","text":"84847618    ACCESS POINT  CISCO  WAP361  SN-F21  $4,200   No","size":6.5,"color":DARK,"dy":5},
    ], height=84)
    pdf.bullet("Haga clic en Localizado/Sobrante/No Localizado para ver el detalle de cada grupo")
    pdf.bullet("Tabla con: Codigo, Descripcion, Marca, Modelo, Serie, Valor, Depreciado")

    # ── 6. Bitácoras — solo admin/super ──
    if is_admin:
        pdf.add_page()
        pdf.section_title("Bitacoras y Exportacion","6")
        pdf.body("Acceso desde 'Bitacoras' en el menu lateral.")

        pdf.subsection("6.1  Clasificaciones de Equipos")
        pdf.body("Historial de todos los escaneos clasificados. Columnas:")
        pdf.table(
            ["Columna","Descripcion"],
            [
                ["Fecha","Fecha y hora del escaneo"],
                ["Codigo Barras","Codigo del equipo"],
                ["Clasificacion","LOCALIZADO / SOBRANTE / SOBRANTE DESCONOCIDO / NO LOCALIZADO"],
                ["Descripcion","Tipo de equipo"],
                ["Marca","Fabricante"],
                ["Serie","Numero de serie del equipo"],
                ["Valor Real","Valor calculado del activo"],
                ["Depreciado","Si / No segun vida util"],
                ["Tienda","Tienda donde se escaneo"],
            ],[35,155]
        )
        pdf.bullet("Filtro por tipo de clasificacion")
        pdf.bullet("Exportacion Excel incluye columnas Serie y Depreciado")

        pdf.subsection("6.2  Movimientos (ALTAS, BAJAS, TRANSFERENCIAS)")
        pdf.table(
            ["Filtro","Que muestra"],
            [
                ["Todos","Todos los movimientos"],
                ["No Localizado (BAJA)","Solo movimientos de baja"],
                ["Sobrante (ALTA)","Solo registros de alta"],
                ["Transferencias","Solo transferencias entre tiendas"],
            ],[50,140]
        )
        pdf.body("Botones de exportacion:")
        pdf.bullet("'Exportar ALTAS/BAJAS': SIGAF_AB_[FECHA].xlsx (incluye hoja con fotos de formatos)")
        pdf.bullet("'Exportar Transferencias': SIGAF_TRANSFERENCIAS_[FECHA].xlsx (incluye fotos)")

        pdf.subsection("6.3  Historial de Auditorias")
        pdf.screen_mock("Resumen de Auditoria en Bitacoras",[
            {"type":"text","text":"ARIAS TIJ  |  Completada  |  08/03/26","size":8,"style":"B","color":NAVY,"dy":6},
            {"type":"kpirow","values":[
                ("Localizado","1",GREEN),
                ("Sobrante","2",AMBER),
                ("No Local.","33",RED),
            ]},
            {"type":"text","text":"<-- Clic en tarjetas para filtrar equipos -->","size":7,"color":GRAY,"dy":5},
            {"type":"divider","dy":3},
            {"type":"text","text":"NO LOCALIZADO (33): MONITOR - VIEWSONIC  Serie: TEY152060895","size":7,"color":DARK,"dy":5},
        ], height=66)
        pdf.body("Botones en el pie del resumen:")
        pdf.table(
            ["Boton","Funcion"],
            [
                ["Descargar AB","Descarga la foto del formato ALTAS/BAJAS como JPG"],
                ["Descargar Transf.","Descarga la foto del formato TRANSFERENCIAS como JPG"],
                ["Reporte PDF","Genera reporte ejecutivo de una pagina listo para imprimir"],
            ],[40,150] if not is_super else [40,148]
        )
        if is_super:
            pdf.bullet("Eliminar Auditoria: solo disponible para Super Administrador")

    # ── 7. Administración — solo super ──
    if is_super:
        pdf.add_page()
        pdf.section_title("Panel de Administracion","7")
        pdf.body("Disponible solo para Super Administrador. Se accede desde 'Administracion' en el menu lateral.")
        pdf.subsection("7.1  Gestion de Usuarios")
        pdf.bullet("Crear nuevos usuarios: nombre, email, contrasena y perfil")
        pdf.bullet("Editar usuarios existentes")
        pdf.bullet("Eliminar usuarios")
        pdf.subsection("7.2  Gestion de Equipos")
        pdf.bullet("Buscar equipos por codigo, descripcion o serie; filtrar por plaza")
        pdf.bullet("Editar campos: descripcion, marca, modelo, serie, costo, depreciacion")
        pdf.subsection("7.3  Reinicio de Datos")
        for i,s in enumerate([
            "Ir a Administracion > 'Reiniciar Datos'",
            "Adjuntar MAF.xlsx con el inventario actualizado",
            "Adjuntar USUARIOS.xlsx (opcional)",
            "Confirmar la operacion",
        ],1):
            pdf.bullet(f"{i}. {s}")
        pdf.note_box("ADVERTENCIA CRITICA","Esta accion elimina TODOS los datos: auditorias, movimientos, escaneos, equipos. NO SE PUEDE DESHACER.", RED,(255,235,235))

    # ── Configuración ──
    sec_num = "8" if is_super else ("7" if is_admin else "6")
    pdf.add_page()
    pdf.section_title("Configuracion del Sistema", sec_num)
    pdf.table(
        ["Opcion","Valores","Descripcion"],
        [
            ["Tema","Claro / Oscuro","Cambia el esquema de colores"],
            ["Idioma","Espanol / Ingles","Traduce todos los textos del sistema"],
            ["Paleta","Profesional / OXXO","Azul marino (Profesional) o Rojo/Amarillo corporativo"],
        ],[28,40,122]
    )

    # ── FAQ adaptado al perfil ──
    faq_num = "9" if is_super else ("8" if is_admin else "7")
    pdf.add_page()
    pdf.section_title("Preguntas Frecuentes", faq_num)

    faq_common = [
        ("La tienda no muestra el estado 'En Progreso'",
         "Recargue la pagina. Si persiste, cierre sesion y vuelva a ingresar."),
        ("Escanee un codigo incorrecto, como lo elimino?",
         "En el historial de escaneos, presione el icono X junto al registro incorrecto."),
        ("Puedo cancelar una auditoria en curso?",
         "Si. Presione CANCELAR (rojo) en el modulo. Debe escribir el motivo. La tienda queda disponible para nueva auditoria."),
        ("El Zebra no escanea en SIGAF",
         "Verifique que DataWedge este activo. Toque primero el campo de escaneo para darle el foco. Si persiste, reinicie DataWedge."),
        ("Que pasa con un equipo Sobrante Desconocido?",
         "Se abre el formulario para registrarlo: Descripcion, Marca, Modelo y Serie (opcional). Al confirmar queda registrado como ALTA."),
        ("Que significa estado INCOMPLETO?",
         "Mas del 20% de los equipos no fueron localizados. El sistema lo marca automaticamente."),
        ("Como fotografio los formatos al finalizar?",
         "Al finalizar si hay movimientos, aparece el dialogo de fotos. Use el boton 'Abrir Camara' para cada formato. Puede omitirlas si no aplica."),
    ]
    faq_admin = [
        ("Donde estan las fotos de los formatos de movimiento?",
         "En Bitacoras > Historial de Auditorias. Abra el resumen y use los botones 'Descargar AB' o 'Descargar Transf.'"),
        ("Como imprimo el reporte de una auditoria?",
         "En el resumen de auditoria presione 'Reporte PDF'. Use Ctrl+P para imprimir."),
        ("La exportacion Excel no incluye lo que espero",
         "Verifique el filtro activo antes de exportar. La exportacion respeta el filtro seleccionado."),
    ]
    faq_super = [
        ("Como reinicio los datos del sistema?",
         "Administracion > 'Reiniciar Datos'. Adjunte MAF.xlsx y USUARIOS.xlsx. ADVERTENCIA: esta accion es irreversible."),
        ("Como creo un nuevo usuario?",
         "Administracion > Usuarios > 'Nuevo Usuario'. Complete nombre, email, contrasena y seleccione el perfil."),
    ]
    faq_list = faq_common + (faq_admin if is_admin else []) + (faq_super if is_super else [])
    for q, a in faq_list:
        pdf.subsection(q)
        pdf.body(a)

    out = io.BytesIO()
    pdf.output(out)
    out.seek(0)
    return out

# ═══════════════════════════════════════════════════════════════
#  PRESENTACION DEL PROYECTO
# ═══════════════════════════════════════════════════════════════

def generate_presentation(stats, plazas_data):
    pdf = SigafPDF("SIGAF - Presentacion Ejecutiva")
    pdf.alias_nb_pages()

    pdf.cover("SIGAF", "Sistema Integral de Gestion de Activo Fijo", "Presentacion Ejecutiva - Marzo 2026")

    # ── 1. Problemática ──
    pdf.add_page()
    pdf.section_title("Problematica","1")
    pdf.body("La gestion de activos fijos de computo en cadenas de tiendas de conveniencia presenta desafios criticos que impactan el control financiero y operativo:")
    for p in [
        "Control manual de inventario propenso a errores, omisiones y duplicidades",
        "Imposibilidad de rastrear equipos desplazados entre tiendas y plazas",
        "Auditorias lentas, dependientes de formatos fisicos y personal especializado",
        "Ausencia de metricas en tiempo real para la toma de decisiones",
        "Inconsistencia entre el registro en sistemas (MAF) y la existencia fisica de equipos",
        "Tiempo elevado para consolidar y reportar resultados de cada ciclo de auditoria",
        "Sin evidencia fotografica ni trazabilidad de movimientos de activos",
    ]:
        pdf.bullet(p, color=RED)
    pdf.note_box("Impacto financiero","La falta de control preciso genera diferencias entre el valor contable y el valor real de los activos, dificultando decisiones de reemplazo, deprecacion y deteccion de mermas.", AMBER,(255,248,230))

    # ── 2. Solución ──
    pdf.add_page()
    pdf.section_title("Solucion: SIGAF","2")
    pdf.body("SIGAF es una plataforma web integral desarrollada para OXXO que digitaliza completamente el proceso de auditoria de activos fijos de computo.")

    pdf.subsection("Propuesta de valor")
    for v in [
        "Auditoria digital completa con lectores de codigo de barras Zebra TC52",
        "Clasificacion automatica en tiempo real: Localizado, Sobrante, No Localizado",
        "Trazabilidad completa: ALTAS, BAJAS y TRANSFERENCIAS con evidencia fotografica",
        "Dashboard con KPIs dinamicos por plaza para supervision gerencial",
        "Generacion automatica de documentos Excel con formato corporativo AF",
        "Control de acceso por roles (Super Admin / Administrador / Socio Tecnologico)",
        "Plataforma PWA: funciona en Zebra TC52, tablet y PC sin instalacion adicional",
        "Reporte PDF ejecutivo por auditoria listo para presentar o imprimir",
    ]:
        pdf.bullet(v, color=GREEN)

    pdf.screen_mock("Dashboard SIGAF - Vista Real",[
        {"type":"text","text":"Bienvenido, Benjamin Ruiz","size":7.5,"color":GRAY,"dy":5},
        {"type":"kpirow","values":[
            ("Tiendas","1,010",NAVY),
            ("Auditadas","124",GREEN),
            ("Equipos","28,430",BLUE),
            ("Depreciados","3,211",AMBER),
        ]},
        {"type":"text","text":"RESUMEN DE TIENDAS (1,010) - Plaza: Todas","size":7.5,"style":"B","color":NAVY,"dy":5},
        {"type":"divider","dy":3},
        {"type":"text","text":"10TIJ Ensenada  CR:32UHH  24 equipos    [ Pendiente ]","size":7,"color":DARK,"dy":5},
        {"type":"text","text":"ARIAS TIJ  CR:50REP  35 equipos          [ Auditada  ]","size":7,"color":GREEN,"dy":5},
        {"type":"text","text":"Abelardo TIJ  CR:50SYP  35 equipos       [ En Progreso ]","size":7,"color":BLUE,"dy":5},
    ], height=80)

    # ── 3. Arquitectura ──
    pdf.add_page()
    pdf.section_title("Arquitectura Tecnica","3")
    pdf.table(
        ["Componente","Tecnologia","Funcion","Despliegue"],
        [
            ["Frontend","React 19 + Tailwind CSS","Interfaz responsive y PWA","Railway"],
            ["Backend","FastAPI Python 3.12","API REST y logica de negocio","Railway (Docker)"],
            ["Base de datos","MongoDB Atlas","Almacenamiento NoSQL cloud","MongoDB Cloud"],
            ["Autenticacion","JWT + bcrypt","Control de acceso seguro","En API"],
            ["Exportacion Excel","OpenPyXL","Archivos con formato corporativo","En API"],
            ["Generacion PDF","FPDF2","Manual y presentacion dinamicos","En API"],
            ["Dispositivo campo","Zebra TC52 + DataWedge","Lectura de codigos de barras","On-site"],
        ],[32,42,60,30]
    )

    pdf.subsection("Flujo de operacion")
    pdf.body("Zebra TC52 (DataWedge keystroke) --> Campo de escaneo React --> API FastAPI --> MongoDB Atlas --> Clasificacion automatica --> Actualizacion en tiempo real de contadores y tabla")

    pdf.note_box("Rendimiento","El sistema maneja mas de 30,000 registros de equipos con tiempos de respuesta inferiores a 200ms. Preparado para uso simultaneo de multiples auditores en diferentes tiendas.", GREEN,(230,255,235))

    # ── 4. Módulo de Auditoría ──
    pdf.add_page()
    pdf.section_title("Modulo de Auditoria (Inventario) - Detalle","4")
    pdf.body("El modulo de auditoria es el nucleo de SIGAF. Permite realizar el inventario fisico completo de una tienda de manera rapida y precisa.")

    pdf.subsection("Flujo completo de auditoria")
    for i,(t,d) in enumerate([
        ("Seleccionar tienda","Hacer clic en la tienda en el panel principal"),
        ("Iniciar Auditoria","Presionar el boton. El estado cambia a 'En Progreso' (azul)"),
        ("Escanear equipos","Usar Zebra TC52: el codigo se clasifica en menos de 0.5 segundos"),
        ("Clasificacion automatica","Localizado / Sobrante / Sobrante Desconocido"),
        ("Registrar sobrantes","Formulario: descripcion, marca, modelo, serie opcional"),
        ("Confirmar transferencias","Equipos de otras tiendas: confirmar la transferencia"),
        ("Finalizar auditoria","Sistema procesa y aplica bajas automaticas"),
        ("Fotografiar formatos","Foto obligatoria del formato AF firmado (si hay movimientos)"),
        ("Ver resumen","Estadisticas con detalle filtrable por grupo de equipos"),
    ],1):
        pdf.set_font("Helvetica","B",10)
        pdf.set_text_color(*NAVY)
        pdf.set_x(10)
        pdf.cell(7,6,safe(f"{i}."),align="R")
        pdf.cell(40,6,safe(f" {t}"),align="L")
        pdf.set_font("Helvetica","",10)
        pdf.set_text_color(*DARK)
        pdf.multi_cell(0,6,safe(f": {d}"))

    pdf.screen_mock("Auditoria en Proceso con Zebra TC52",[
        {"type":"text","text":"ABELARDO TIJ  |  35 equipos en MAF  |  En Progreso","size":8,"style":"B","color":NAVY,"dy":6},
        {"type":"kpirow","values":[
            ("Localizado","28",GREEN),
            ("Sobrante","2",AMBER),
            ("No Local.","5",RED),
        ]},
        {"type":"text","text":"[_________________________________________]  [Escanear]  <- Zebra TC52","size":7.5,"color":DARK,"dy":7},
        {"type":"bar","pct":0.86,"color":GREEN,"w":165,"x":5,"dy":6},
        {"type":"text","text":"Progreso: 30 de 35 equipos (86%)","size":7,"color":GRAY,"dy":6},
        {"type":"divider","dy":3},
        {"type":"text","text":"84847784  HAND HELD ZEBRA TC52    -> LOCALIZADO","size":7,"color":GREEN,"dy":5},
        {"type":"text","text":"63738745  ESCANER (de 10TIJ Ensenada) -> SOBRANTE (transferir?)","size":7,"color":AMBER,"dy":5},
    ], height=90)

    # ── 5. Evidencia y Trazabilidad ──
    pdf.add_page()
    pdf.section_title("Evidencia y Trazabilidad","5")

    pdf.subsection("Foto de formatos de movimiento")
    pdf.body("Al finalizar la auditoria, si existen movimientos de ALTA/BAJA o TRANSFERENCIA, el sistema solicita la captura fotografica del formato fisico firmado:")
    pdf.table(
        ["Formato","Cuando aplica","Se incluye en..."],
        [
            ["Formato AF ALTAS/BAJAS","Existen movimientos de alta o baja","Resumen de auditoria, bitacora, Excel exportado"],
            ["Formato AF TRANSFERENCIAS","Existen movimientos de transferencia","Resumen de auditoria, bitacora, Excel exportado"],
        ],[40,65,85]
    )

    pdf.subsection("Registro de movimientos")
    pdf.table(
        ["Tipo","Origen","Resultado en el sistema"],
        [
            ["ALTA","Equipo sobrante desconocido registrado manualmente","Se integra al MAF de la tienda con todos sus datos"],
            ["BAJA","Equipo no localizado al finalizar auditoria","Se registra la baja, queda en historial de movimientos"],
            ["TRANSFERENCIA","Equipo sobrante de otra tienda confirmado","Se reasigna al MAF de la tienda destino"],
        ],[28,70,92]
    )

    pdf.subsection("Reporte PDF ejecutivo por auditoria")
    pdf.body("Desde el historial de auditorias se puede generar un reporte ejecutivo de UNA pagina con:")
    for item in [
        "Encabezado con datos de la tienda (nombre, CR, plaza, auditor, fecha)",
        "4 KPIs: Total equipos, Localizados, Sobrantes, No Localizados",
        "Valor total de equipos no localizados",
        "Tabla de equipos no localizados (hasta 20) con valor y depreciacion",
        "Fotos de formatos de movimiento (ALTAS/BAJAS y TRANSFERENCIAS)",
        "Pie de pagina con fecha de generacion",
    ]:
        pdf.bullet(item)

    # ── 6. Datos del sistema ──
    if stats:
        pdf.add_page()
        pdf.section_title("Datos Actuales del Sistema","6")
        pdf.kpi_row([
            ("Total Tiendas",   f"{stats.get('total_stores',0):,}", NAVY),
            ("Total Equipos",   f"{stats.get('total_equipment',0):,}", BLUE),
            ("Equipos Activos", f"{stats.get('active_equipment',0):,}", GREEN),
            ("Depreciados",     f"{stats.get('deprecated_equipment',0):,}", AMBER),
        ])
        pdf.kpi_row([
            ("Costo Registrado",  f"${stats.get('total_cost',0):,.0f}", NAVY),
            ("Valor Real Total",  f"${stats.get('total_real_value',0):,.0f}", BLUE),
            ("Auditorias Comp.",  str(stats.get("completed_audits",0)), GREEN),
            ("Tiendas Auditadas", str(stats.get("audited_stores",0)), AMBER),
        ])
        if stats.get("equipment_by_plaza"):
            pdf.subsection("Distribucion de equipos por plaza")
            total_eq = max(stats.get("total_equipment",1),1)
            plaza_rows = [[p,f"{c:,}",f"{c/total_eq*100:.1f}%"]
                          for p,c in sorted(stats["equipment_by_plaza"].items(),key=lambda x:-x[1])]
            pdf.table(["Plaza","Equipos","% del Total"],plaza_rows,[70,60,60])

    # ── 7. Estado del proyecto ──
    pdf.add_page()
    pdf.section_title("Estado del Proyecto","7")
    pdf.table(
        ["Funcionalidad","Estado","Ambiente"],
        [
            ["Dashboard con KPIs dinamicos por plaza","Completado","Produccion"],
            ["Modulo de Auditoria (Inventario)","Completado","Produccion"],
            ["Clasificacion automatica en tiempo real","Completado","Produccion"],
            ["Registro de Sobrante Desconocido con Serie","Completado","Produccion"],
            ["Evidencia fotografica de formatos AF","Completado","Produccion"],
            ["Exportacion Excel (AB + Transferencias + Fotos)","Completado","Produccion"],
            ["Bitacoras filtrables con Serie y Depreciado","Completado","Produccion"],
            ["Resumen interactivo de auditoria","Completado","Produccion"],
            ["Reporte PDF ejecutivo por auditoria","Completado","Produccion"],
            ["Manual de Usuario PDF dinamico","Completado","Produccion"],
            ["Badge 'En Progreso' en tarjetas de tienda","Completado","Produccion"],
            ["Dispositivos Zebra TC52 configurados","En proceso","Actualizacion OS pendiente"],
        ],[90,32,68]
    )

    # ── 8. Beneficios ──
    pdf.add_page()
    pdf.section_title("Beneficios","8")
    for title,desc in [
        ("Eficiencia operativa",
         "Reduccion de hasta 80% en tiempo de auditoria. Una tienda de 30 equipos puede auditarse en menos de 15 minutos con el Zebra TC52."),
        ("Visibilidad gerencial en tiempo real",
         "Dashboard con KPIs actualizados al instante. Supervisores pueden monitorear el avance desde cualquier dispositivo."),
        ("Trazabilidad y cumplimiento",
         "Cada movimiento registrado con fecha, hora, usuario, datos del equipo y foto del formato fisico firmado."),
        ("Control financiero preciso",
         "Calculo automatico de valor real, identificacion de depreciados y cuantificacion exacta del valor de faltantes por tienda y plaza."),
        ("Reduccion de errores",
         "La clasificacion automatica y el escaneo digital eliminan errores humanos de captura. Los formatos fisicos pasan a ser evidencia, no la fuente principal."),
        ("Escalabilidad cloud",
         "Arquitectura lista para +1,000 tiendas y +50,000 equipos. Tiempo de respuesta sub-segundo garantizado en MongoDB Atlas."),
    ]:
        pdf.subsection(title)
        pdf.body(desc)

    # ── 9. Siguientes pasos ──
    pdf.add_page()
    pdf.section_title("Siguientes Pasos","9")
    for s in [
        "Completar actualizacion de OS en dispositivos Zebra TC52 para uso operativo",
        "Capacitacion de auditores en el uso del sistema y DataWedge",
        "Piloto inicial en un grupo de tiendas por plaza para validacion",
        "Integracion con sistema ERP/SAP para sincronizacion automatica del MAF",
        "Modo offline robusto para tiendas con conectividad limitada",
        "Dashboard gerencial con comparativas historicas entre ciclos de auditoria",
        "Notificaciones automaticas por correo al completar auditorias",
        "App nativa Android optimizada para Zebra TC52",
    ]:
        pdf.bullet(s)

    # Cierre
    pdf.ln(12)
    if pdf.get_y() < 230:
        y = pdf.get_y()
        pdf.set_fill_color(*NAVY)
        pdf.rect(10, y, 190, 32, 'F')
        pdf.set_y(y+7)
        pdf.set_font("Helvetica","B",15)
        pdf.set_text_color(*WHITE)
        pdf.cell(210,8,safe("Gracias por su atencion"),align="C",new_x="LMARGIN",new_y="NEXT")
        pdf.set_font("Helvetica","",9.5)
        pdf.set_text_color(180,200,240)
        pdf.cell(210,7,safe("SIGAF - OXXO Direccion de Sistemas"),align="C",new_x="LMARGIN",new_y="NEXT")
        pdf.cell(210,7,safe("benjamin.ruiz@oxxo.com"),align="C")

    out = io.BytesIO()
    pdf.output(out)
    out.seek(0)
    return out
