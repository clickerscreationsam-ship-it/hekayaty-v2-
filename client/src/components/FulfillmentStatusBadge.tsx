import { Badge } from "@/components/ui/badge";

interface FulfillmentStatusBadgeProps {
    status: string;
}

export function FulfillmentStatusBadge({ status }: FulfillmentStatusBadgeProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-500 hover:bg-yellow-600';
            case 'accepted':
                return 'bg-blue-500 hover:bg-blue-600';
            case 'preparing':
                return 'bg-indigo-500 hover:bg-indigo-600';
            case 'shipped':
                return 'bg-purple-500 hover:bg-purple-600';
            case 'delivered':
                return 'bg-green-500 hover:bg-green-600';
            case 'rejected':
                return 'bg-red-500 hover:bg-red-600';
            case 'cancelled':
                return 'bg-gray-500 hover:bg-gray-600';
            default:
                return 'bg-gray-400 hover:bg-gray-500';
        }
    };

    return (
        <Badge className={`${getStatusColor(status)} text-white`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
    );
}
