import type { Workflow } from './types';

export const initialWorkflow: Workflow = {
    "name": "{{zis_integration_key}}",
    "description": "{{zis_description}}",
    "zis_template_version": "2019-10-14",
    "resources": {
        "{{jobspec_bigtime}}": {
            "type": "ZIS::JobSpec",
            "properties": {
                "name": "{{jobspec_bigtime}}",
                "event_source": "{{jobspec_bigtime_event_source}}",
                "event_type": "{{jobspec_bigtime_event_type}}",
                "flow_name": "zis:{{zis_integration_key}}:flow:{{jobspec_bigtime}}_flow"
            }
        },

        "{{jobspec_bigtime}}_flow": {
            "type": "ZIS::Flow",
            "properties": {
                "name": "{{jobspec_bigtime}}_flow",
                "definition": {
                    "StartAt": "001.ZIS.LoadConfig",
                    "States": {
                        "001.ZIS.LoadConfig": {
                            "Comment": "Load ZIS settings from config",
                            "Type": "Action",
                            "ActionName": "zis:common:action:LoadConfig",
                            "Parameters": {
                                "scope": "{{zis_integration_key}}_settings"
                            },
                            "ResultPath": "$.config",
                            "Next": "002.Choice.CheckIfChannelIsMessaging"
                        },
                        "002.Choice.CheckIfChannelIsMessaging": {
                            "Type": "Choice",
                            "Comment": "Check if channel is messaging",
                            "Choices": [
                                {
                                    "Variable": "$.input.ticket_event.ticket.via.channel",
                                    "StringEquals": "native_messaging",
                                    "Next": "003.Zendesk.GetTicketAudits"
                                }
                            ],
                            "Default": "010.EndFlow.ChannelNotMessaging"
                        },
                        "003.Zendesk.GetTicketAudits": {
                            "Type": "Action",
                            "Comment": "Get zendesk ticket audits api",
                            "ActionName": "zis:{{zis_integration_key}}:action:zendesk.get_ticket_audits",
                            "Parameters": {
                                "ticketId.$": "{{$.input.ticket_event.ticket.id}}"
                            },
                            "ResultPath": "$.ticket_audits",
                            "Next": "004.Transform.GetConversationIdFromAudits"
                        },
                        "004.Transform.GetConversationIdFromAudits": {
                            "Type": "Action",
                            "Comment": "Set null if conversation id not is present else the value",
                            "ActionName": "zis:common:transform:Jq",
                            "Parameters": {
                                "expr": "[(.ticket_audits.audits[] | .events[] | select(.type == \"ChatStartedEvent\") | if (.value.conversation_id == null or .value.conversation_id == \"\") then null else .value.conversation_id end)][0] // null",
                                "data.$": "$"
                            },
                            "ResultPath": "$.conversation_id",
                            "Next": "005.Choice.CheckIfConversationIdWasFound"
                        },
                        "005.Choice.CheckIfConversationIdWasFound": {
                            "Type": "Choice",
                            "Comment": "Check if conversation id is present",
                            "Choices": [
                                {
                                    "Variable": "$.conversation_id",
                                    "IsPresent": true,
                                    "Next": "006.Transform.CreateUpdateTicketPayload"
                                }
                            ],
                            "Default": "009.EndFlow.NoConversationIdFound"
                        },
                        "006.Transform.CreateUpdateTicketPayload": {
                            "Type": "Action",
                            "Comment": "Create zendesk ticket update payload to update conversation id custom field",
                            "ActionName": "zis:common:transform:Jq",
                            "Parameters": {
                                "expr": "{\"ticket\": {\"custom_fields\": [{\"id\": .config.conversation_id_ticket_field_id,\"value\": .conversation_id }]}}",
                                "data.$": "$"
                            },
                            "ResultPath": "$.payload",
                            "Next": "007.Zendesk.UpdateTicketField"
                        },
                        "007.Zendesk.UpdateTicketField": {
                            "Type": "Action",
                            "Comment": "Update zendesk ticket",
                            "ActionName": "zis:{{zis_integration_key}}:action:zendesk.update_ticket",
                            "Parameters": {
                                "ticketId.$": "$.input.ticket_event.ticket.id",
                                "payload.$": "$.payload"
                            },
                            "ResultPath": "$.ticket_response",
                            "Next": "008.Success.EndFlow"
                        },
                        "008.Success.EndFlow": {
                            "Type": "Succeed",
                            "Message": "ZIS Executed || #{{$.input.ticket_event.ticket.id}} || Conversation ID ({{$.conversation_id}}) Updated Successfully"
                        },
                        "009.EndFlow.NoConversationIdFound": {
                            "Type": "Succeed",
                            "Message": "ZIS Executed || #{{$.input.ticket_event.ticket.id}} || No Conversation ID Found"
                        },
                        "010.EndFlow.ChannelNotMessaging": {
                            "Type": "Succeed",
                            "Message": "ZIS Executed || #{{$.input.ticket_event.ticket.id}} || Channel Not Messaging"
                        }
                    }
                }
            }
        },
        "debugger_print_log": {
            "type": "ZIS::Action::Http",
            "properties": {
                "name": "debugger_print_log",
                "definition": {
                    "method": "POST",
                    "url": "{{$.endpoint}}",
                    "requestBody": {
                        "payload": "$.allData"
                    }
                }
            }
        },
        "zendesk.get_ticket_audits": {
            "type": "ZIS::Action::Http",
            "properties": {
                "name": "zendesk.get_ticket_audits",
                "definition": {
                    "method": "GET",
                    "path": "/api/v2/tickets/{{$.ticketId}}/audits",
                    "connectionName": "zendesk",
                    "headers": [
                        {
                            "key": "Content-Type",
                            "value": "application/json"
                        }
                    ]
                }
            }
        },
        "zendesk.update_ticket": {
            "type": "ZIS::Action::Http",
            "properties": {
                "name": "zendesk.update_ticket",
                "definition": {
                    "method": "PUT",
                    "path": "/api/v2/tickets/{{$.ticketId}}",
                    "connectionName": "zendesk",
                    "headers": [
                        {
                            "key": "Content-Type",
                            "value": "application/json"
                        }
                    ],
                    "requestBody.$": "$.payload"
                }
            }
        }      
    }
}
