param workflows_shadow_me_interns_logic_app_name string = 'shadow_me_interns_logic_app'
param location string = resourceGroup().location
param cosmosDbAccountName string = 'shadow-me-interns-db-msft'
param cosmosDbDatabaseName string = 'shadow_meetings'
param cosmosDbContainerName string = 'meetings'
resource outlookConnection 'Microsoft.Web/connections@2016-06-01' = {
  name: 'outlook'
  location: location
  properties: {
    displayName: 'Outlook.com'
    api: {
      id: '/subscriptions/${subscription().subscriptionId}/providers/Microsoft.Web/locations/${location}/managedApis/outlook'
    }
  }
}

resource conversionserviceConnection 'Microsoft.Web/connections@2016-06-01' = {
  name: 'conversionservice'
  location: location
  properties: {
    displayName: 'Content Conversion'
    api: {
      id: '/subscriptions/${subscription().subscriptionId}/providers/Microsoft.Web/locations/${location}/managedApis/conversionservice'
    }
  }
}

resource documentdbConnection 'Microsoft.Web/connections@2016-06-01' = {
  name: 'documentdb'
  location: location
  properties: {
    displayName: 'Azure Cosmos DB'
    api: {
      id: '/subscriptions/${subscription().subscriptionId}/providers/Microsoft.Web/locations/${location}/managedApis/documentdb'
    }
  }
}

resource workflows_shadow_me_interns_logic_app_name_resource 'Microsoft.Logic/workflows@2017-07-01' = {
  name: workflows_shadow_me_interns_logic_app_name
  location: location
  dependsOn: [
    outlookConnection
    conversionserviceConnection
    documentdbConnection
  ]
  properties: {
    state: 'Enabled'
    definition: {
      metadata: {
        agentType: 'autonomous'
      }
      '$schema': 'https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#'
      contentVersion: '1.0.0.0'
      parameters: {
        '$connections': {
          defaultValue: {}
          type: 'Object'
        }
      }
      triggers: {
        'When_a_new_email_arrives_(V2)': {
          splitOn: '@triggerBody()?[\'value\']'
          type: 'ApiConnectionNotification'
          inputs: {
            host: {
              connection: {
                name: '@parameters(\'$connections\')[\'outlook\'][\'connectionId\']'
              }
            }
            fetch: {
              pathTemplate: {
                template: '/v2/Mail/OnNewEmail'
              }
              method: 'get'
              queries: {
                importance: 'Any'
                fetchOnlyWithAttachment: false
                includeAttachments: true
                folderPath: 'Inbox'
              }
            }
            subscribe: {
              body: {
                NotificationUrl: '@listCallbackUrl()'
              }
              pathTemplate: {
                template: '/MailSubscriptionPoke/$subscriptions'
              }
              method: 'post'
              queries: {
                importance: 'Any'
                fetchOnlyWithAttachment: false
                folderPath: 'Inbox'
              }
            }
          }
        }
      }
      actions: {
        extraction_agent: {
          runAfter: {
            Html_to_text: [
              'Succeeded'
            ]
          }
          limit: {
            count: 10
          }
          type: 'Agent'
          inputs: {
            parameters: {
              messages: [
                {
                  role: 'system'
                  content: 'Extract meeting details from forwarded emails and output strictly as JSON. First, scan the email body for a manual key-value override block (e.g., "FW Name: [Name]", "Capacity: [Number]", "Role: [Role]"). These explicit mappings take absolute priority over the signature or original invite details. Keys might vary slightly in wording. If you find the forwarder\'s name but no email in the overrides, aggressively scan the rest of the email body/headers. All dates MUST be formatted strictly as YYYY-MM-DD. Default capacity to 1 if not explicitly mentioned. Always leave joined_interns as an empty array.'
                }
                {
                  role: 'user'
                  content: 'Subject: @{triggerBody()?[\'Subject\']}'
                }
                {
                  role: 'user'
                  content: 'Body: @{body(\'Html_to_text\')}'
                }
              ]
              agentModelType: 'AzureOpenAI'
              agentModelSettings: {
                agentHistoryReductionSettings: {
                  agentHistoryReductionType: 'maximumTokenCountReduction'
                  maximumTokenCount: 128000
                }
                agentChatCompletionSettings: {
                  responseFormat: {
                    json_schema: {
                      type: 'object'
                      properties: {
                        original_sender: {
                          type: 'string'
                          description: 'The email of the original invite sender'
                        }
                        forwarded_by_name: {
                          type: 'string'
                          description: 'Name of the FTE who forwarded the invite'
                        }
                        forwarded_by_email: {
                          type: 'string'
                          description: 'Email of the FTE who forwarded the invite'
                        }
                        subject: {
                          type: 'string'
                        }
                        date: {
                          type: 'string'
                          description: 'The date of the meeting. MUST strictly follow the format YYYY-MM-DD'
                        }
                        start_time: {
                          type: 'string'
                          description: 'The start time of the meeting'
                        }
                        end_time: {
                          type: 'string'
                          description: 'The end time of the meeting'
                        }
                        location: {
                          type: 'string'
                          description: 'Meeting location if mentioned'
                        }
                        meeting_link: {
                          type: 'string'
                          description: 'The Microsoft Teams join link'
                        }
                        role: {
                          type: 'string'
                          description: 'The sender\'s job role if present. Must be one of: SE, CSA, SSP, CSAM, CELA. Maps long forms to these short forms. Prioritize explicit mappings in the email body over signature data. Leave empty if not found.'
                        }
                        team: {
                          type: 'string'
                          description: 'The sender\'s team name if present. Prioritize explicit mappings in the email body over signature data. Leave empty if not found.'
                        }
                        sector: {
                          type: 'string'
                          description: 'The sector if present. Must be one of: EC, PS. Maps Enterprise Commercial to EC and Public Sector to PS. Prioritize explicit mappings in the email body over signature data. Leave empty if not found.'
                        }
                        capacity: {
                          type: 'number'
                          description: 'If no explicit capacity is mentioned in the text body mapping, default to 1.'
                        }
                        joined_interns: {
                          type: 'array'
                          items: {
                            type: 'string'
                          }
                          description: 'Always leave this as an empty array []'
                        }
                      }
                      required: [
                        'forwarded_by_name'
                        'forwarded_by_email'
                        'subject'
                        'date'
                        'start_time'
                        'end_time'
                        'meeting_link'
                      ]
                    }
                    type: 'json_schema'
                  }
                }
              }
              modelId: 'gpt-4o-mini'
            }
          }
        }
        Html_to_text: {
          runAfter: {}
          type: 'ApiConnection'
          inputs: {
            host: {
              connection: {
                name: '@parameters(\'$connections\')[\'conversionservice\'][\'connectionId\']'
              }
            }
            method: 'post'
            body: '<p class="editor-paragraph">@{triggerBody()?[\'Body\']}</p>'
            path: '/html2text'
          }
        }
        Parse_JSON: {
          runAfter: {
            extraction_agent: [
              'Succeeded'
            ]
          }
          type: 'ParseJson'
          inputs: {
            content: '@outputs(\'extraction_agent\')'
            schema: {
              type: 'object'
              properties: {
                lastAssistantMessage: {
                  type: 'object'
                  properties: {
                    original_sender: {
                      type: 'string'
                    }
                    forwarded_by_name: {
                      type: 'string'
                    }
                    forwarded_by_email: {
                      type: 'string'
                    }
                    subject: {
                      type: 'string'
                    }
                    date: {
                      type: 'string'
                    }
                    start_time: {
                      type: 'string'
                    }
                    end_time: {
                      type: 'string'
                    }
                    location: {
                      type: 'string'
                    }
                    meeting_link: {
                      type: 'string'
                    }
                    role: {
                      type: 'string'
                    }
                    team: {
                      type: 'string'
                    }
                    sector: {
                      type: 'string'
                    }
                    capacity: {
                      type: 'integer'
                    }
                    joined_interns: {
                      type: 'array'
                    }
                  }
                }
                metadata: {
                  type: 'object'
                  properties: {}
                }
              }
            }
          }
        }
        Condition: {
          actions: {
            'Create_or_update_document_(V3)': {
              type: 'ApiConnection'
              inputs: {
                host: {
                  connection: {
                    name: '@parameters(\'$connections\')[\'documentdb-1\'][\'connectionId\']'
                  }
                }
                method: 'post'
                body: {
                  id: '@{guid()}'
                  original_sender: '@{body(\'Parse_JSON\')?[\'lastAssistantMessage\']?[\'original_sender\']}'
                  forwarded_by_name: '@{body(\'Parse_JSON\')?[\'lastAssistantMessage\']?[\'forwarded_by_name\']}'
                  forwarded_by_email: '@{body(\'Parse_JSON\')?[\'lastAssistantMessage\']?[\'forwarded_by_email\']}'
                  subject: '@{body(\'Parse_JSON\')?[\'lastAssistantMessage\']?[\'subject\']}'
                  date: '@{body(\'Parse_JSON\')?[\'lastAssistantMessage\']?[\'date\']}'
                  start_time: '@{body(\'Parse_JSON\')?[\'lastAssistantMessage\']?[\'start_time\']}'
                  end_time: '@{body(\'Parse_JSON\')?[\'lastAssistantMessage\']?[\'end_time\']}'
                  location: '@{body(\'Parse_JSON\')?[\'lastAssistantMessage\']?[\'location\']}'
                  meeting_link: '@{body(\'Parse_JSON\')?[\'lastAssistantMessage\']?[\'meeting_link\']}'
                  role: '@{body(\'Parse_JSON\')?[\'lastAssistantMessage\']?[\'role\']}'
                  team: '@{body(\'Parse_JSON\')?[\'lastAssistantMessage\']?[\'team\']}'
                  sector: '@{body(\'Parse_JSON\')?[\'lastAssistantMessage\']?[\'sector\']}'
                  capacity: '@body(\'Parse_JSON\')?[\'lastAssistantMessage\']?[\'capacity\']'
                  joined_interns: []
                }
                path: '/v2/cosmosdb/@{encodeURIComponent(\'https://${cosmosDbAccountName}\')}/dbs/@{encodeURIComponent(\'${cosmosDbDatabaseName}\')}/colls/@{encodeURIComponent(\'${cosmosDbContainerName}\')}/docs'
              }
            }
          }
          runAfter: {
            Parse_JSON: [
              'Succeeded'
            ]
          }
          else: {
            actions: {}
          }
          expression: {
            and: [
              {
                not: {
                  equals: [
                    '@body(\'Parse_JSON\')?[\'lastAssistantMessage\']?[\'meeting_link\']'
                    ''
                  ]
                }
              }
            ]
          }
          type: 'If'
        }
      }
      outputs: {}
    }
    parameters: {
      '$connections': {
        value: {
          outlook: {
            id: '/subscriptions/${subscription().subscriptionId}/providers/Microsoft.Web/locations/${location}/managedApis/outlook'
            connectionId: outlookConnection.id
            connectionName: 'outlook'
            connectionProperties: {}
          }
          conversionservice: {
            id: '/subscriptions/${subscription().subscriptionId}/providers/Microsoft.Web/locations/${location}/managedApis/conversionservice'
            connectionId: conversionserviceConnection.id
            connectionName: 'conversionservice'
            connectionProperties: {}
          }
          'documentdb-1': {
            id: '/subscriptions/${subscription().subscriptionId}/providers/Microsoft.Web/locations/${location}/managedApis/documentdb'
            connectionId: documentdbConnection.id
            connectionName: 'documentdb'
            connectionProperties: {}
          }
        }
      }
    }
  }
}
