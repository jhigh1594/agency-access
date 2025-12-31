/**
 * Meta Ad Account Sharing Instructions Content
 * 
 * Step-by-step instructions for manually sharing ad accounts in Meta Business Manager
 */

export const META_AD_ACCOUNT_INSTRUCTIONS = {
  en: {
    title: 'Grant access to your Ad Accounts (Manual)',
    description: 'Follow this guide to grant access',
    step1: {
      title: 'Select Assets',
      description: 'Select the ad accounts you want to grant access to',
      businessIdLabel: 'Business Manager ID',
    },
    step2: {
      title: 'Share Asset',
      description: 'Navigate to Meta Ads in Meta Business Suite (Settings → Ad accounts), then:',
      substeps: [
        'Select the ad account from the sidebar and click the "Assign Partner" button',
        'In the "Partner business ID" textbox, enter:',
        'Check the "Manage ad accounts" checkbox',
        'Click the "Assign" button',
        'Wait for the indicator to turn from waiting to granted',
      ],
    },
    openBusinessManager: 'Open Business Manager',
    markComplete: "I've completed these steps",
  },
  es: {
    title: 'Conceder acceso a tus cuentas de anuncios (Manual)',
    description: 'Sigue esta guía para conceder acceso',
    step1: {
      title: 'Seleccionar activos',
      description: 'Selecciona las cuentas de anuncios a las que quieres conceder acceso',
      businessIdLabel: 'ID del Business Manager',
    },
    step2: {
      title: 'Compartir activo',
      description: 'Navega a Meta Ads en Meta Business Suite (Configuración → Cuentas de anuncios), luego:',
      substeps: [
        'Selecciona la cuenta de anuncios desde la barra lateral y haz clic en el botón "Asignar socio"',
        'En el cuadro de texto "ID del Business Manager del socio", ingresa:',
        'Marca la casilla "Administrar cuentas de anuncios"',
        'Haz clic en el botón "Asignar"',
        'Espera a que el indicador cambie de esperando a concedido',
      ],
    },
    openBusinessManager: 'Abrir Business Manager',
    markComplete: 'He completado estos pasos',
  },
  nl: {
    title: 'Geef toegang tot je advertentieaccounts (Handmatig)',
    description: 'Volg deze gids om toegang te verlenen',
    step1: {
      title: 'Selecteer activa',
      description: 'Selecteer de advertentieaccounts waaraan je toegang wilt verlenen',
      businessIdLabel: 'Business Manager ID',
    },
    step2: {
      title: 'Deel activum',
      description: 'Navigeer naar Meta Ads in Meta Business Suite (Instellingen → Advertentieaccounts), dan:',
      substeps: [
        'Selecteer het advertentieaccount vanuit de zijbalk en klik op de knop "Partner toewijzen"',
        'Voer in het tekstvak "Partner Business Manager ID" in:',
        'Vink het selectievakje "Advertentieaccounts beheren" aan',
        'Klik op de knop "Toewijzen"',
        'Wacht totdat de indicator verandert van wachten naar toegekend',
      ],
    },
    openBusinessManager: 'Business Manager openen',
    markComplete: 'Ik heb deze stappen voltooid',
  },
} as const;

export type MetaAdAccountInstructionsLanguage = keyof typeof META_AD_ACCOUNT_INSTRUCTIONS;

