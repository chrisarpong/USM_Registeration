import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useAuditLogger() {
    const logActivity = useMutation(api.auditLogs.logActivity);

    const log = async (action: string, details: string) => {
        try {
            // Fetch IP address securely
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            const ipAddress = data.ip || 'Unknown IP';

            await logActivity({
                action,
                details,
                ipAddress,
                adminName: localStorage.getItem('admin_name') || 'Admin'
            });
        } catch (error) {
            console.error('Failed to log admin activity:', error);
        }
    };

    return { log };
}
