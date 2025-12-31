/**
 * Meta Access Messages Content
 * 
 * Success and error messages for Meta access granting flow
 */

export const META_ACCESS_MESSAGES = {
  en: {
    grantingPages: 'Granting access to your selected Pages...',
    pagesSuccess: {
      title: 'Pages access granted!',
      description: 'The agency now has access to {count} page(s)',
    },
    adAccountsManual: {
      title: 'Now share your Ad Accounts',
      description: 'Follow the steps below to manually share your ad accounts',
    },
    complete: {
      title: 'Access granted successfully!',
      description: 'The agency now has access to all selected assets',
    },
  },
  es: {
    grantingPages: 'Concediendo acceso a tus Páginas seleccionadas...',
    pagesSuccess: {
      title: '¡Acceso a Páginas concedido!',
      description: 'La agencia ahora tiene acceso a {count} página(s)',
    },
    adAccountsManual: {
      title: 'Ahora comparte tus cuentas de anuncios',
      description: 'Sigue los pasos a continuación para compartir manualmente tus cuentas de anuncios',
    },
    complete: {
      title: '¡Acceso concedido exitosamente!',
      description: 'La agencia ahora tiene acceso a todos los activos seleccionados',
    },
  },
  nl: {
    grantingPages: 'Toegang verlenen aan je geselecteerde Pagina\'s...',
    pagesSuccess: {
      title: 'Pagina-toegang verleend!',
      description: 'Het bureau heeft nu toegang tot {count} pagina(\'s)',
    },
    adAccountsManual: {
      title: 'Deel nu je advertentieaccounts',
      description: 'Volg de onderstaande stappen om je advertentieaccounts handmatig te delen',
    },
    complete: {
      title: 'Toegang succesvol verleend!',
      description: 'Het bureau heeft nu toegang tot alle geselecteerde activa',
    },
  },
} as const;

export type MetaAccessMessagesLanguage = keyof typeof META_ACCESS_MESSAGES;

