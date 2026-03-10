import { getCurrentTimeDefinition, executeGetCurrentTime, getCurrentTimeSchema } from "./getCurrentTime.js";
import {
    gmailSearchDefinition, executeGmailSearch, gmailSearchSchema,
    gmailSendDefinition, executeGmailSend, gmailSendSchema,
    calendarListDefinition, executeCalendarList, calendarListSchema,
    calendarCreateDefinition, executeCalendarCreate, calendarCreateSchema,
} from "./google.js";
import {
    crmSearchLeadDefinition, executeCrmSearchLead, crmSearchLeadSchema,
    crmCreateLeadDefinition, executeCrmCreateLead, crmCreateLeadSchema,
    crmCreateQuotationDefinition, executeCrmCreateQuotation, crmCreateQuotationSchema,
    crmCreateContractDefinition, executeCrmCreateContract, crmCreateContractSchema,
    crmUpdateLeadStatusDefinition, executeCrmUpdateLeadStatus, crmUpdateLeadStatusSchema,
    getCompanyKnowledgeDefinition, executeGetCompanyKnowledge, getCompanyKnowledgeSchema,
    updateKnowledgeBaseDefinition, executeUpdateKnowledgeBase, updateKnowledgeBaseSchema,
    crmSendDocumentDefinition, executeCrmSendDocument, crmSendDocumentSchema,
} from "./crm.js";
import { whatsappSendDefinition, executeWhatsappSend, whatsappSendSchema } from "./whatsapp.js";
import { triggerMakeDefinition, executeTriggerMake, triggerMakeSchema } from "./makecom.js";
import { z } from "zod";

export const AVAILABLE_TOOLS = [
    getCurrentTimeDefinition,
    gmailSearchDefinition,
    gmailSendDefinition,
    calendarListDefinition,
    calendarCreateDefinition,
    crmSearchLeadDefinition,
    crmCreateLeadDefinition,
    crmCreateQuotationDefinition,
    crmCreateContractDefinition,
    crmUpdateLeadStatusDefinition,
    getCompanyKnowledgeDefinition,
    updateKnowledgeBaseDefinition,
    crmSendDocumentDefinition,
    whatsappSendDefinition,
    triggerMakeDefinition,
];

export async function executeTool(name: string, argsStr: string): Promise<string> {
    try {
        const args = JSON.parse(argsStr);

        switch (name) {
            case "get_current_time": {
                const parsedArgs = getCurrentTimeSchema.parse(args);
                return await executeGetCurrentTime(parsedArgs);
            }
            case "gmail_search": {
                const parsedArgs = gmailSearchSchema.parse(args);
                return await executeGmailSearch(parsedArgs);
            }
            case "gmail_send": {
                const parsedArgs = gmailSendSchema.parse(args);
                return await executeGmailSend(parsedArgs);
            }
            case "calendar_list_events": {
                const parsedArgs = calendarListSchema.parse(args);
                return await executeCalendarList(parsedArgs);
            }
            case "calendar_create_event": {
                const parsedArgs = calendarCreateSchema.parse(args);
                return await executeCalendarCreate(parsedArgs);
            }
            case "crm_search_lead": {
                const parsedArgs = crmSearchLeadSchema.parse(args);
                return await executeCrmSearchLead(parsedArgs);
            }
            case "crm_create_lead": {
                const parsedArgs = crmCreateLeadSchema.parse(args);
                return await executeCrmCreateLead(parsedArgs);
            }
            case "crm_create_quotation": {
                const parsedArgs = crmCreateQuotationSchema.parse(args);
                return await executeCrmCreateQuotation(parsedArgs);
            }
            case "crm_create_contract": {
                const parsedArgs = crmCreateContractSchema.parse(args);
                return await executeCrmCreateContract(parsedArgs);
            }
            case "crm_update_lead_status": {
                const parsedArgs = crmUpdateLeadStatusSchema.parse(args);
                return await executeCrmUpdateLeadStatus(parsedArgs);
            }
            case "get_company_knowledge": {
                const parsedArgs = getCompanyKnowledgeSchema.parse(args);
                return await executeGetCompanyKnowledge();
            }
            case "update_knowledge_base": {
                const parsedArgs = updateKnowledgeBaseSchema.parse(args);
                return await executeUpdateKnowledgeBase(parsedArgs);
            }
            case "whatsapp_send_message": {
                const parsedArgs = whatsappSendSchema.parse(args);
                return await executeWhatsappSend(parsedArgs);
            }
            case "crm_send_document": {
                const parsedArgs = crmSendDocumentSchema.parse(args);
                return await executeCrmSendDocument(parsedArgs);
            }
            case "trigger_make_scenario": {
                const parsedArgs = triggerMakeSchema.parse(args);
                return await executeTriggerMake(parsedArgs);
            }
            default:
                return `Error: Tool '${name}' not found.`;
        }
    } catch (error) {
        return `Error executing tool '${name}': ${(error as Error).message}`;
    }
}
