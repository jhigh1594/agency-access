/**
 * Meta Grant Access Content
 * 
 * Content strings for Meta automatic and manual access granting flows
 */

export const META_GRANT_ACCESS = {
  en: {
    automatic: {
      title: 'Automatic',
      subtitle: 'These services can be granted access to automatically',
      facebookPages: {
        title: 'Facebook Pages',
        accessLevel: 'Admin', // or from access request
        grantButton: 'Grant Access',
        granting: 'Granting...',
        success: 'Access granted successfully',
        error: 'Failed to grant access',
      },
    },
  },
  es: {
    automatic: {
      title: 'Automático',
      subtitle: 'Estos servicios pueden recibir acceso automáticamente',
      facebookPages: {
        title: 'Páginas de Facebook',
        accessLevel: 'Administrador',
        grantButton: 'Conceder acceso',
        granting: 'Concediendo...',
        success: 'Acceso concedido exitosamente',
        error: 'Error al conceder acceso',
      },
    },
  },
  nl: {
    automatic: {
      title: 'Automatisch',
      subtitle: 'Deze services kunnen automatisch toegang krijgen',
      facebookPages: {
        title: 'Facebook Pagina\'s',
        accessLevel: 'Beheerder',
        grantButton: 'Toegang verlenen',
        granting: 'Toegang verlenen...',
        success: 'Toegang succesvol verleend',
        error: 'Toegang verlenen mislukt',
      },
    },
  },
} as const;

export type MetaGrantAccessLanguage = keyof typeof META_GRANT_ACCESS;

