export const translations = {
  es: {
    app: { name: "SIGAF", fullName: "Sistema Integral de Gestión de Activo Fijo" },
    nav: { dashboard: "Panel", logs: "Bitácoras", admin: "Administración", settings: "Configuración", logout: "Cerrar Sesión" },
    auth: { login: "Iniciar Sesión", email: "Correo electrónico", password: "Contraseña", signIn: "Acceder", invalidCredentials: "Credenciales inválidas", welcome: "Bienvenido" },
    dashboard: {
      welcome: "Bienvenido", totalStores: "Total Tiendas", auditedStores: "Tiendas Auditadas",
      unauditedStores: "Sin Auditar", totalEquipment: "Total Equipos", deprecatedEquipment: "Equipos Depreciados",
      activeEquipment: "Equipos Activos", totalCost: "Costo Total", totalRealValue: "Valor Real Total",
      activeAudits: "Auditorías Activas", completedAudits: "Auditorías Completadas",
      filterByPlaza: "Filtrar por Plaza", allPlazas: "Todas las Plazas", searchStore: "Buscar tienda por CR o nombre...",
      startAudit: "Iniciar Auditoría", continueAudit: "Continuar Auditoría", viewDetails: "Ver Detalles",
      audited: "Auditada", notAudited: "Pendiente", inProgress: "En Progreso",
      equipmentCount: "equipos", storeDetails: "Detalles de Tienda",
      storesOverview: "Resumen de Tiendas", equipmentByPlaza: "Equipos por Plaza",
      mostMissing: "Mayor Faltante", leastMissing: "Menor Faltante"
    },
    audit: {
      title: "Auditoría de Inventario", scanBarcode: "Escanear Código de Barras",
      enterBarcode: "Ingrese o escanee código de barras...", scanOrType: "Escanear o escribir",
      located: "Localizado", surplus: "Sobrante", surplusUnknown: "Sobrante Desconocido",
      notFound: "No Localizado", alreadyScanned: "Ya escaneado",
      finalize: "Finalizar Auditoría", finalizeConfirm: "¿Está seguro de finalizar la auditoría?",
      finalizeWarning: "Los equipos no escaneados se clasificarán como No Localizados",
      summary: "Resumen de Auditoría", equipment: "Equipos", scanned: "Escaneados",
      transfer: "Transferencia", disposal: "Solicitar Baja", requestDisposal: "Solicitar Baja",
      transferFrom: "Transferir desde", transferTo: "Transferir a",
      confirmTransfer: "Confirmar Transferencia", originStore: "Tienda Origen",
      destinationStore: "Tienda Destino", movementsPending: "Movimientos Pendientes",
      notFoundValue: "Valor Equipos No Localizados", deprecatedNotFound: "No Localizados Depreciados",
      scanHistory: "Historial de Escaneos", storeEquipment: "Equipos de la Tienda",
      barcode: "Código Barras", description: "Descripción", brand: "Marca",
      model: "Modelo", serial: "Serie", cost: "Costo", realValue: "Valor Real",
      usefulLife: "Vida Útil", remainingLife: "Vida Restante", deprecated: "Depreciado",
      acquisition: "Adquisición", invoice: "Factura", months: "meses",
      activeAsset: "Activo", status: "Estado", classification: "Clasificación",
      equipmentData: "Datos del Equipo", noActiveAudit: "Sin auditoría activa",
      auditCompleted: "Auditoría Completada", backToDashboard: "Volver al Panel"
    },
    logs: {
      title: "Bitácoras", classifications: "Clasificación de Equipos",
      movements: "Movimientos (Transferencias/Bajas)", auditHistory: "Historial de Auditorías",
      exportExcel: "Exportar Excel", date: "Fecha", store: "Tienda", auditor: "Auditor",
      type: "Tipo", fromStore: "Tienda Origen", toStore: "Tienda Destino",
      createdBy: "Creado por", transferValue: "Valor Transferencias",
      disposalValue: "Valor Bajas", startDate: "Fecha Inicio", endDate: "Fecha Fin",
      totalEquipment: "Total Equipos", locatedCount: "Localizados", surplusCount: "Sobrantes",
      notFoundCount: "No Localizados", notFoundValue: "Valor No Localizado",
      filterByClassification: "Filtrar por clasificación", filterByType: "Filtrar por tipo",
      all: "Todos", pending: "Pendiente", completed: "Completada"
    },
    admin: {
      title: "Panel de Administración", users: "Usuarios", stores: "Tiendas", equipment: "Equipos",
      create: "Crear", edit: "Editar", delete: "Eliminar", save: "Guardar", cancel: "Cancelar",
      name: "Nombre", profile: "Perfil", superAdmin: "Super Administrador",
      administrator: "Administrador", techPartner: "Socio Tecnológico",
      confirmDelete: "¿Está seguro de eliminar?", userCreated: "Usuario creado",
      userUpdated: "Usuario actualizado", userDeleted: "Usuario eliminado",
      searchEquipment: "Buscar equipo...", searchUsers: "Buscar usuario..."
    },
    settings: {
      title: "Configuración", theme: "Tema", language: "Idioma", palette: "Paleta de Colores",
      dark: "Oscuro", light: "Claro", spanish: "Español", english: "Inglés", portuguese: "Português",
      professional: "Profesional", oxxo: "Corporativo OXXO",
      themeDesc: "Cambia entre tema claro y oscuro", languageDesc: "Selecciona el idioma de la interfaz",
      paletteDesc: "Selecciona la paleta de colores"
    },
    common: {
      loading: "Cargando...", error: "Error", success: "Éxito", search: "Buscar",
      filter: "Filtrar", save: "Guardar", cancel: "Cancelar", confirm: "Confirmar",
      close: "Cerrar", noResults: "Sin resultados", page: "Página", of: "de",
      total: "Total", prev: "Anterior", next: "Siguiente", actions: "Acciones",
      yes: "Sí", no: "No", back: "Volver", plaza: "Plaza", cr: "CR"
    }
  },
  en: {
    app: { name: "SIGAF", fullName: "Fixed Asset Management System" },
    nav: { dashboard: "Dashboard", logs: "Logs", admin: "Admin", settings: "Settings", logout: "Logout" },
    auth: { login: "Login", email: "Email", password: "Password", signIn: "Sign In", invalidCredentials: "Invalid credentials", welcome: "Welcome" },
    dashboard: {
      welcome: "Welcome", totalStores: "Total Stores", auditedStores: "Audited Stores",
      unauditedStores: "Unaudited", totalEquipment: "Total Equipment", deprecatedEquipment: "Deprecated Equipment",
      activeEquipment: "Active Equipment", totalCost: "Total Cost", totalRealValue: "Total Real Value",
      activeAudits: "Active Audits", completedAudits: "Completed Audits",
      filterByPlaza: "Filter by Plaza", allPlazas: "All Plazas", searchStore: "Search store by CR or name...",
      startAudit: "Start Audit", continueAudit: "Continue Audit", viewDetails: "View Details",
      audited: "Audited", notAudited: "Pending", inProgress: "In Progress",
      equipmentCount: "equipment", storeDetails: "Store Details",
      storesOverview: "Stores Overview", equipmentByPlaza: "Equipment by Plaza",
      mostMissing: "Most Missing", leastMissing: "Least Missing"
    },
    audit: {
      title: "Inventory Audit", scanBarcode: "Scan Barcode",
      enterBarcode: "Enter or scan barcode...", scanOrType: "Scan or type",
      located: "Located", surplus: "Surplus", surplusUnknown: "Unknown Surplus",
      notFound: "Not Found", alreadyScanned: "Already scanned",
      finalize: "Finalize Audit", finalizeConfirm: "Are you sure you want to finalize?",
      finalizeWarning: "Unscanned equipment will be classified as Not Found",
      summary: "Audit Summary", equipment: "Equipment", scanned: "Scanned",
      transfer: "Transfer", disposal: "Request Disposal", requestDisposal: "Request Disposal",
      transferFrom: "Transfer from", transferTo: "Transfer to",
      confirmTransfer: "Confirm Transfer", originStore: "Origin Store",
      destinationStore: "Destination Store", movementsPending: "Pending Movements",
      notFoundValue: "Not Found Equipment Value", deprecatedNotFound: "Deprecated Not Found",
      scanHistory: "Scan History", storeEquipment: "Store Equipment",
      barcode: "Barcode", description: "Description", brand: "Brand",
      model: "Model", serial: "Serial", cost: "Cost", realValue: "Real Value",
      usefulLife: "Useful Life", remainingLife: "Remaining Life", deprecated: "Deprecated",
      acquisition: "Acquisition", invoice: "Invoice", months: "months",
      activeAsset: "Active", status: "Status", classification: "Classification",
      equipmentData: "Equipment Data", noActiveAudit: "No active audit",
      auditCompleted: "Audit Completed", backToDashboard: "Back to Dashboard"
    },
    logs: {
      title: "Logs", classifications: "Equipment Classification",
      movements: "Movements (Transfers/Disposals)", auditHistory: "Audit History",
      exportExcel: "Export Excel", date: "Date", store: "Store", auditor: "Auditor",
      type: "Type", fromStore: "Origin Store", toStore: "Destination Store",
      createdBy: "Created by", transferValue: "Transfer Value",
      disposalValue: "Disposal Value", startDate: "Start Date", endDate: "End Date",
      totalEquipment: "Total Equipment", locatedCount: "Located", surplusCount: "Surplus",
      notFoundCount: "Not Found", notFoundValue: "Not Found Value",
      filterByClassification: "Filter by classification", filterByType: "Filter by type",
      all: "All", pending: "Pending", completed: "Completed"
    },
    admin: {
      title: "Admin Panel", users: "Users", stores: "Stores", equipment: "Equipment",
      create: "Create", edit: "Edit", delete: "Delete", save: "Save", cancel: "Cancel",
      name: "Name", profile: "Profile", superAdmin: "Super Admin",
      administrator: "Administrator", techPartner: "Tech Partner",
      confirmDelete: "Are you sure you want to delete?", userCreated: "User created",
      userUpdated: "User updated", userDeleted: "User deleted",
      searchEquipment: "Search equipment...", searchUsers: "Search user..."
    },
    settings: {
      title: "Settings", theme: "Theme", language: "Language", palette: "Color Palette",
      dark: "Dark", light: "Light", spanish: "Spanish", english: "English", portuguese: "Portuguese",
      professional: "Professional", oxxo: "OXXO Corporate",
      themeDesc: "Toggle between light and dark theme", languageDesc: "Select interface language",
      paletteDesc: "Select color palette"
    },
    common: {
      loading: "Loading...", error: "Error", success: "Success", search: "Search",
      filter: "Filter", save: "Save", cancel: "Cancel", confirm: "Confirm",
      close: "Close", noResults: "No results", page: "Page", of: "of",
      total: "Total", prev: "Previous", next: "Next", actions: "Actions",
      yes: "Yes", no: "No", back: "Back", plaza: "Plaza", cr: "CR"
    }
  },
  pt: {
    app: { name: "SIGAF", fullName: "Sistema Integrado de Gestão de Ativos Fixos" },
    nav: { dashboard: "Painel", logs: "Registros", admin: "Administração", settings: "Configurações", logout: "Sair" },
    auth: { login: "Entrar", email: "E-mail", password: "Senha", signIn: "Acessar", invalidCredentials: "Credenciais inválidas", welcome: "Bem-vindo" },
    dashboard: {
      welcome: "Bem-vindo", totalStores: "Total de Lojas", auditedStores: "Lojas Auditadas",
      unauditedStores: "Não Auditadas", totalEquipment: "Total de Equipamentos", deprecatedEquipment: "Equipamentos Depreciados",
      activeEquipment: "Equipamentos Ativos", totalCost: "Custo Total", totalRealValue: "Valor Real Total",
      activeAudits: "Auditorias Ativas", completedAudits: "Auditorias Concluídas",
      filterByPlaza: "Filtrar por Praça", allPlazas: "Todas as Praças", searchStore: "Buscar loja por CR ou nome...",
      startAudit: "Iniciar Auditoria", continueAudit: "Continuar Auditoria", viewDetails: "Ver Detalhes",
      audited: "Auditada", notAudited: "Pendente", inProgress: "Em Andamento",
      equipmentCount: "equipamentos", storeDetails: "Detalhes da Loja",
      storesOverview: "Resumo das Lojas", equipmentByPlaza: "Equipamentos por Praça",
      mostMissing: "Maior Falta", leastMissing: "Menor Falta"
    },
    audit: {
      title: "Auditoria de Inventário", scanBarcode: "Escanear Código de Barras",
      enterBarcode: "Digite ou escaneie o código de barras...", scanOrType: "Escanear ou digitar",
      located: "Localizado", surplus: "Excedente", surplusUnknown: "Excedente Desconhecido",
      notFound: "Não Localizado", alreadyScanned: "Já escaneado",
      finalize: "Finalizar Auditoria", finalizeConfirm: "Tem certeza que deseja finalizar a auditoria?",
      finalizeWarning: "Equipamentos não escaneados serão classificados como Não Localizados",
      summary: "Resumo da Auditoria", equipment: "Equipamentos", scanned: "Escaneados",
      transfer: "Transferência", disposal: "Solicitar Baixa", requestDisposal: "Solicitar Baixa",
      transferFrom: "Transferir de", transferTo: "Transferir para",
      confirmTransfer: "Confirmar Transferência", originStore: "Loja de Origem",
      destinationStore: "Loja de Destino", movementsPending: "Movimentos Pendentes",
      notFoundValue: "Valor de Equipamentos Não Localizados", deprecatedNotFound: "Não Localizados Depreciados",
      scanHistory: "Histórico de Escaneamentos", storeEquipment: "Equipamentos da Loja",
      barcode: "Código de Barras", description: "Descrição", brand: "Marca",
      model: "Modelo", serial: "Série", cost: "Custo", realValue: "Valor Real",
      usefulLife: "Vida Útil", remainingLife: "Vida Restante", deprecated: "Depreciado",
      acquisition: "Aquisição", invoice: "Nota Fiscal", months: "meses",
      activeAsset: "Ativo", status: "Status", classification: "Classificação",
      equipmentData: "Dados do Equipamento", noActiveAudit: "Sem auditoria ativa",
      auditCompleted: "Auditoria Concluída", backToDashboard: "Voltar ao Painel"
    },
    logs: {
      title: "Registros", classifications: "Classificação de Equipamentos",
      movements: "Movimentos (Transferências/Baixas)", auditHistory: "Histórico de Auditorias",
      exportExcel: "Exportar Excel", date: "Data", store: "Loja", auditor: "Auditor",
      type: "Tipo", fromStore: "Loja de Origem", toStore: "Loja de Destino",
      createdBy: "Criado por", transferValue: "Valor de Transferências",
      disposalValue: "Valor de Baixas", startDate: "Data de Início", endDate: "Data de Fim",
      totalEquipment: "Total de Equipamentos", locatedCount: "Localizados", surplusCount: "Excedentes",
      notFoundCount: "Não Localizados", notFoundValue: "Valor Não Localizado",
      filterByClassification: "Filtrar por classificação", filterByType: "Filtrar por tipo",
      all: "Todos", pending: "Pendente", completed: "Concluída"
    },
    admin: {
      title: "Painel de Administração", users: "Usuários", stores: "Lojas", equipment: "Equipamentos",
      create: "Criar", edit: "Editar", delete: "Excluir", save: "Salvar", cancel: "Cancelar",
      name: "Nome", profile: "Perfil", superAdmin: "Super Administrador",
      administrator: "Administrador", techPartner: "Parceiro Tecnológico",
      confirmDelete: "Tem certeza que deseja excluir?", userCreated: "Usuário criado",
      userUpdated: "Usuário atualizado", userDeleted: "Usuário excluído",
      searchEquipment: "Buscar equipamento...", searchUsers: "Buscar usuário..."
    },
    settings: {
      title: "Configurações", theme: "Tema", language: "Idioma", palette: "Paleta de Cores",
      dark: "Escuro", light: "Claro", spanish: "Espanhol", english: "Inglês", portuguese: "Português",
      professional: "Profissional", oxxo: "Corporativo OXXO",
      themeDesc: "Alternar entre tema claro e escuro", languageDesc: "Selecione o idioma da interface",
      paletteDesc: "Selecione a paleta de cores"
    },
    common: {
      loading: "Carregando...", error: "Erro", success: "Sucesso", search: "Buscar",
      filter: "Filtrar", save: "Salvar", cancel: "Cancelar", confirm: "Confirmar",
      close: "Fechar", noResults: "Sem resultados", page: "Página", of: "de",
      total: "Total", prev: "Anterior", next: "Próximo", actions: "Ações",
      yes: "Sim", no: "Não", back: "Voltar", plaza: "Praça", cr: "CR"
    }
  }
};
