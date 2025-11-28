export type ActionTemplate = {
  id: string;
  name: string;
  description: string;
  type: 'ZIS::Action::Http';
  category: 'Tickets' | 'Users' | 'Organizations' | 'Custom Objects' | 'Generic';
  suggestedActionId: string;
  defaultConfig: {
    name: string;
    definition: {
      url?: string;
      path?: string;
      method: string;
      headers?: Record<string, string>;
      requestBody?: any;
      [key: string]: any;
    };
  };
};

// ============================================
// TICKET TEMPLATES
// ============================================
const ticketTemplates: ActionTemplate[] = [
  {
    id: 'zendesk_list_tickets',
    name: 'List Tickets',
    description: 'Get a list of tickets from Zendesk',
    type: 'ZIS::Action::Http',
    category: 'Tickets',
    suggestedActionId: 'Zendesk.GetTicketsList',
    defaultConfig: {
      name: 'Zendesk.GetTicketsList',
      definition: {
        path: '/api/v2/tickets.json',
        method: 'GET',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    },
  },
  {
    id: 'zendesk_show_ticket',
    name: 'Get Ticket',
    description: 'Get details of a specific ticket',
    type: 'ZIS::Action::Http',
    category: 'Tickets',
    suggestedActionId: 'Zendesk.GetTicket',
    defaultConfig: {
      name: 'Zendesk.GetTicket',
      definition: {
        path: '/api/v2/tickets/{{$.ticket_id}}.json',
        method: 'GET',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    },
  },
  {
    id: 'zendesk_create_ticket',
    name: 'Create Ticket',
    description: 'Create a new ticket in Zendesk',
    type: 'ZIS::Action::Http',
    category: 'Tickets',
    suggestedActionId: 'Zendesk.CreateTicket',
    defaultConfig: {
      name: 'Zendesk.CreateTicket',
      definition: {
        path: '/api/v2/tickets.json',
        method: 'POST',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
        requestBody: {
          ticket: {
            subject: 'My printer is on fire!',
            comment: {
              body: 'The smoke is very colorful.',
            },
            priority: 'urgent',
          },
        },
      },
    },
  },
  {
    id: 'zendesk_update_ticket',
    name: 'Update Ticket',
    description: 'Update an existing ticket',
    type: 'ZIS::Action::Http',
    category: 'Tickets',
    suggestedActionId: 'Zendesk.UpdateTicket',
    defaultConfig: {
      name: 'Zendesk.UpdateTicket',
      definition: {
        path: '/api/v2/tickets/{{$.ticket_id}}.json',
        method: 'PUT',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
        requestBody: {
          ticket: {
            status: 'solved',
            comment: {
              body: 'Thanks for choosing our service.',
              public: true,
            },
          },
        },
      },
    },
  },
  {
    id: 'zendesk_add_ticket_comment',
    name: 'Add Ticket Comment',
    description: 'Add a comment to an existing ticket',
    type: 'ZIS::Action::Http',
    category: 'Tickets',
    suggestedActionId: 'Zendesk.UpdateTicketComment',
    defaultConfig: {
      name: 'Zendesk.UpdateTicketComment',
      definition: {
        path: '/api/v2/tickets/{{$.ticket_id}}.json',
        method: 'PUT',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
        requestBody: {
          ticket: {
            comment: {
              body: 'This is a follow-up comment',
              public: true,
            },
          },
        },
      },
    },
  },
  {
    id: 'zendesk_list_ticket_comments',
    name: 'List Ticket Comments',
    description: 'Get all comments for a ticket',
    type: 'ZIS::Action::Http',
    category: 'Tickets',
    suggestedActionId: 'Zendesk.GetTicketCommentsList',
    defaultConfig: {
      name: 'Zendesk.GetTicketCommentsList',
      definition: {
        path: '/api/v2/tickets/{{$.ticket_id}}/comments.json',
        method: 'GET',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    },
  },
  {
    id: 'zendesk_assign_ticket',
    name: 'Assign Ticket',
    description: 'Assign a ticket to an agent',
    type: 'ZIS::Action::Http',
    category: 'Tickets',
    suggestedActionId: 'Zendesk.UpdateTicketAssign',
    defaultConfig: {
      name: 'Zendesk.UpdateTicketAssign',
      definition: {
        path: '/api/v2/tickets/{{$.ticket_id}}.json',
        method: 'PUT',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
        requestBody: {
          ticket: {
            assignee_id: '{{$.agent_id}}',
            status: 'open',
          },
        },
      },
    },
  },
  {
    id: 'zendesk_update_ticket_priority',
    name: 'Update Ticket Priority',
    description: 'Change the priority of a ticket',
    type: 'ZIS::Action::Http',
    category: 'Tickets',
    suggestedActionId: 'Zendesk.UpdateTicketPriority',
    defaultConfig: {
      name: 'Zendesk.UpdateTicketPriority',
      definition: {
        path: '/api/v2/tickets/{{$.ticket_id}}.json',
        method: 'PUT',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
        requestBody: {
          ticket: {
            priority: 'high',
          },
        },
      },
    },
  },
];

// ============================================
// USER TEMPLATES
// ============================================
const userTemplates: ActionTemplate[] = [
  {
    id: 'zendesk_list_users',
    name: 'List Users',
    description: 'Get a list of users from Zendesk',
    type: 'ZIS::Action::Http',
    category: 'Users',
    suggestedActionId: 'Zendesk.GetUsersList',
    defaultConfig: {
      name: 'Zendesk.GetUsersList',
      definition: {
        path: '/api/v2/users.json',
        method: 'GET',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    },
  },
  {
    id: 'zendesk_show_user',
    name: 'Show User',
    description: 'Get details of a specific user',
    type: 'ZIS::Action::Http',
    category: 'Users',
    suggestedActionId: 'Zendesk.GetUser',
    defaultConfig: {
      name: 'Zendesk.GetUser',
      definition: {
        path: '/api/v2/users/{{$.user_id}}.json',
        method: 'GET',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    },
  },
  {
    id: 'zendesk_create_user',
    name: 'Create User',
    description: 'Create a new user in Zendesk',
    type: 'ZIS::Action::Http',
    category: 'Users',
    suggestedActionId: 'Zendesk.CreateUser',
    defaultConfig: {
      name: 'Zendesk.CreateUser',
      definition: {
        path: '/api/v2/users.json',
        method: 'POST',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
        requestBody: {
          user: {
            name: 'Roger Wilco',
            email: 'roge@example.org',
            role: 'end-user',
          },
        },
      },
    },
  },
  {
    id: 'zendesk_update_user',
    name: 'Update User',
    description: 'Update an existing user',
    type: 'ZIS::Action::Http',
    category: 'Users',
    suggestedActionId: 'Zendesk.UpdateUser',
    defaultConfig: {
      name: 'Zendesk.UpdateUser',
      definition: {
        path: '/api/v2/users/{{$.user_id}}.json',
        method: 'PUT',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
        requestBody: {
          user: {
            name: 'Roger Wilco II',
            phone: '+15551234567',
          },
        },
      },
    },
  },
  {
    id: 'zendesk_search_users',
    name: 'Search Users',
    description: 'Search for users by query',
    type: 'ZIS::Action::Http',
    category: 'Users',
    suggestedActionId: 'Zendesk.GetUsersSearch',
    defaultConfig: {
      name: 'Zendesk.GetUsersSearch',
      definition: {
        path: '/api/v2/users/search.json?query={{$.search_query}}',
        method: 'GET',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    },
  },
  {
    id: 'zendesk_user_tickets_requested',
    name: 'User Requested Tickets',
    description: 'Get tickets requested by a user',
    type: 'ZIS::Action::Http',
    category: 'Users',
    suggestedActionId: 'Zendesk.GetUserTicketsRequested',
    defaultConfig: {
      name: 'Zendesk.GetUserTicketsRequested',
      definition: {
        path: '/api/v2/users/{{$.user_id}}/tickets/requested.json',
        method: 'GET',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    },
  },
];

// ============================================
// ORGANIZATION TEMPLATES
// ============================================
const organizationTemplates: ActionTemplate[] = [
  {
    id: 'zendesk_list_organizations',
    name: 'List Organizations',
    description: 'Get a list of organizations from Zendesk',
    type: 'ZIS::Action::Http',
    category: 'Organizations',
    suggestedActionId: 'Zendesk.GetOrganizationsList',
    defaultConfig: {
      name: 'Zendesk.GetOrganizationsList',
      definition: {
        path: '/api/v2/organizations.json',
        method: 'GET',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    },
  },
  {
    id: 'zendesk_show_organization',
    name: 'Show Organization',
    description: 'Get details of a specific organization',
    type: 'ZIS::Action::Http',
    category: 'Organizations',
    suggestedActionId: 'Zendesk.GetOrganization',
    defaultConfig: {
      name: 'Zendesk.GetOrganization',
      definition: {
        path: '/api/v2/organizations/{{$.organization_id}}.json',
        method: 'GET',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    },
  },
  {
    id: 'zendesk_create_organization',
    name: 'Create Organization',
    description: 'Create a new organization in Zendesk',
    type: 'ZIS::Action::Http',
    category: 'Organizations',
    suggestedActionId: 'Zendesk.CreateOrganization',
    defaultConfig: {
      name: 'Zendesk.CreateOrganization',
      definition: {
        path: '/api/v2/organizations.json',
        method: 'POST',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
        requestBody: {
          organization: {
            name: 'My Organization',
          },
        },
      },
    },
  },
  {
    id: 'zendesk_update_organization',
    name: 'Update Organization',
    description: 'Update an existing organization',
    type: 'ZIS::Action::Http',
    category: 'Organizations',
    suggestedActionId: 'Zendesk.UpdateOrganization',
    defaultConfig: {
      name: 'Zendesk.UpdateOrganization',
      definition: {
        path: '/api/v2/organizations/{{$.organization_id}}.json',
        method: 'PUT',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
        requestBody: {
          organization: {
            notes: 'Updated organization details',
          },
        },
      },
    },
  },
  {
    id: 'zendesk_search_organizations',
    name: 'Search Organizations',
    description: 'Search for organizations by external ID or name',
    type: 'ZIS::Action::Http',
    category: 'Organizations',
    suggestedActionId: 'Zendesk.GetOrganizationsSearch',
    defaultConfig: {
      name: 'Zendesk.GetOrganizationsSearch',
      definition: {
        path: '/api/v2/organizations/search.json?external_id={{$.external_id}}',
        method: 'GET',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    },
  },
  {
    id: 'zendesk_organization_tickets',
    name: 'Organization Tickets',
    description: 'Get tickets for a specific organization',
    type: 'ZIS::Action::Http',
    category: 'Organizations',
    suggestedActionId: 'Zendesk.GetOrganizationTickets',
    defaultConfig: {
      name: 'Zendesk.GetOrganizationTickets',
      definition: {
        path: '/api/v2/organizations/{{$.organization_id}}/tickets.json',
        method: 'GET',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    },
  },
];

// ============================================
// CUSTOM OBJECTS TEMPLATES
// ============================================
const customObjectTemplates: ActionTemplate[] = [
  // Custom Objects Management
  {
    id: 'zendesk_list_custom_objects',
    name: 'List Custom Objects',
    description: 'Get a list of all custom objects',
    type: 'ZIS::Action::Http',
    category: 'Custom Objects',
    suggestedActionId: 'Zendesk.GetCustomObjectsList',
    defaultConfig: {
      name: 'Zendesk.GetCustomObjectsList',
      definition: {
        path: '/api/v2/custom_objects',
        method: 'GET',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    },
  },
  {
    id: 'zendesk_show_custom_object',
    name: 'Show Custom Object',
    description: 'Get details of a specific custom object',
    type: 'ZIS::Action::Http',
    category: 'Custom Objects',
    suggestedActionId: 'Zendesk.GetCustomObject',
    defaultConfig: {
      name: 'Zendesk.GetCustomObject',
      definition: {
        path: '/api/v2/custom_objects/{{$.custom_object_key}}',
        method: 'GET',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    },
  },
  {
    id: 'zendesk_create_custom_object',
    name: 'Create Custom Object',
    description: 'Create a new custom object definition',
    type: 'ZIS::Action::Http',
    category: 'Custom Objects',
    suggestedActionId: 'Zendesk.CreateCustomObject',
    defaultConfig: {
      name: 'Zendesk.CreateCustomObject',
      definition: {
        path: '/api/v2/custom_objects',
        method: 'POST',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
        requestBody: {
          custom_object: {
            key: 'apartment',
            title: 'Apartment',
            title_pluralized: 'Apartments',
          },
        },
      },
    },
  },
  {
    id: 'zendesk_update_custom_object',
    name: 'Update Custom Object',
    description: 'Update an existing custom object definition',
    type: 'ZIS::Action::Http',
    category: 'Custom Objects',
    suggestedActionId: 'Zendesk.UpdateCustomObject',
    defaultConfig: {
      name: 'Zendesk.UpdateCustomObject',
      definition: {
        path: '/api/v2/custom_objects/{{$.custom_object_key}}',
        method: 'PATCH',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
        requestBody: {
          custom_object: {
            title: 'Updated Title',
            description: 'Updated description',
          },
        },
      },
    },
  },
  {
    id: 'zendesk_delete_custom_object',
    name: 'Delete Custom Object',
    description: 'Delete a custom object definition',
    type: 'ZIS::Action::Http',
    category: 'Custom Objects',
    suggestedActionId: 'Zendesk.DeleteCustomObject',
    defaultConfig: {
      name: 'Zendesk.DeleteCustomObject',
      definition: {
        path: '/api/v2/custom_objects/{{$.custom_object_key}}',
        method: 'DELETE',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    },
  },

  // Custom Object Records
  {
    id: 'zendesk_list_custom_object_records',
    name: 'List Custom Object Records',
    description: 'Get all records for a custom object with pagination',
    type: 'ZIS::Action::Http',
    category: 'Custom Objects',
    suggestedActionId: 'Zendesk.GetCustomObjectRecordsList',
    defaultConfig: {
      name: 'Zendesk.GetCustomObjectRecordsList',
      definition: {
        path: '/api/v2/custom_objects/{{$.custom_object_key}}/records',
        method: 'GET',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    },
  },
  {
    id: 'zendesk_show_custom_object_record',
    name: 'Show Custom Object Record',
    description: 'Get details of a specific custom object record',
    type: 'ZIS::Action::Http',
    category: 'Custom Objects',
    suggestedActionId: 'Zendesk.GetCustomObjectRecord',
    defaultConfig: {
      name: 'Zendesk.GetCustomObjectRecord',
      definition: {
        path: '/api/v2/custom_objects/{{$.custom_object_key}}/records/{{$.record_id}}',
        method: 'GET',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    },
  },
  {
    id: 'zendesk_create_custom_object_record',
    name: 'Create Custom Object Record',
    description: 'Create a new record in a custom object',
    type: 'ZIS::Action::Http',
    category: 'Custom Objects',
    suggestedActionId: 'Zendesk.CreateCustomObjectRecord',
    defaultConfig: {
      name: 'Zendesk.CreateCustomObjectRecord',
      definition: {
        path: '/api/v2/custom_objects/{{$.custom_object_key}}/records',
        method: 'POST',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
        requestBody: {
          custom_object_record: {
            name: 'My Record',
            custom_object_fields: {
              field_key_1: 'value1',
              field_key_2: 'value2',
            },
          },
        },
      },
    },
  },
  {
    id: 'zendesk_update_custom_object_record',
    name: 'Update Custom Object Record',
    description: 'Update an existing custom object record',
    type: 'ZIS::Action::Http',
    category: 'Custom Objects',
    suggestedActionId: 'Zendesk.UpdateCustomObjectRecord',
    defaultConfig: {
      name: 'Zendesk.UpdateCustomObjectRecord',
      definition: {
        path: '/api/v2/custom_objects/{{$.custom_object_key}}/records/{{$.record_id}}',
        method: 'PATCH',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
        requestBody: {
          custom_object_record: {
            custom_object_fields: {
              field_key_1: 'updated_value',
            },
          },
        },
      },
    },
  },
  {
    id: 'zendesk_delete_custom_object_record',
    name: 'Delete Custom Object Record',
    description: 'Delete a custom object record by ID',
    type: 'ZIS::Action::Http',
    category: 'Custom Objects',
    suggestedActionId: 'Zendesk.DeleteCustomObjectRecord',
    defaultConfig: {
      name: 'Zendesk.DeleteCustomObjectRecord',
      definition: {
        path: '/api/v2/custom_objects/{{$.custom_object_key}}/records/{{$.record_id}}',
        method: 'DELETE',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    },
  },

  // Search and Query
  {
    id: 'zendesk_search_custom_object_records',
    name: 'Search Custom Object Records',
    description: 'Search records with text query',
    type: 'ZIS::Action::Http',
    category: 'Custom Objects',
    suggestedActionId: 'Zendesk.SearchCustomObjectRecords',
    defaultConfig: {
      name: 'Zendesk.SearchCustomObjectRecords',
      definition: {
        path: '/api/v2/custom_objects/{{$.custom_object_key}}/records/search?query={{$.search_query}}',
        method: 'GET',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    },
  },
  {
    id: 'zendesk_filtered_search_custom_object_records',
    name: 'Filtered Search Records',
    description: 'Advanced filtered search with comparison operators',
    type: 'ZIS::Action::Http',
    category: 'Custom Objects',
    suggestedActionId: 'Zendesk.FilteredSearchCustomObjectRecords',
    defaultConfig: {
      name: 'Zendesk.FilteredSearchCustomObjectRecords',
      definition: {
        path: '/api/v2/custom_objects/{{$.custom_object_key}}/records/search',
        method: 'POST',
        connectionName: 'zendesk',
        headers: {
          'Content-Type': 'application/json',
        },
        requestBody: {
          filter: {
            $and: [
              {
                'custom_object_fields.field_key': {
                  $eq: 'value',
                },
              },
            ],
          },
        },
      },
    },
  },
];

// ============================================
// GENERIC TEMPLATES
// ============================================
const genericTemplates: ActionTemplate[] = [
  {
    id: 'http_get_request',
    name: 'HTTP GET Request',
    description: 'Fetch data from an external API',
    type: 'ZIS::Action::Http',
    category: 'Generic',
    suggestedActionId: 'Custom.GetRequest',
    defaultConfig: {
      name: 'Custom.GetRequest',
      definition: {
        url: 'https://api.example.com/endpoint',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    },
  },
  {
    id: 'http_post_webhook',
    name: 'Webhook POST',
    description: 'Send data to a webhook endpoint',
    type: 'ZIS::Action::Http',
    category: 'Generic',
    suggestedActionId: 'Debug.PostToWebhook',
    defaultConfig: {
      name: 'Debug.PostToWebhook',
      definition: {
        url: 'https://webhook.site/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        requestBody: {
          data: '{{$.data}}',
        },
      },
    },
  },
];

// Combine all templates
export const actionTemplates: ActionTemplate[] = [
  ...ticketTemplates,
  ...userTemplates,
  ...organizationTemplates,
  ...customObjectTemplates,
  ...genericTemplates,
];
