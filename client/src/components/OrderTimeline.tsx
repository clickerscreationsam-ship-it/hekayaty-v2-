import { CheckCircle2, Circle, Truck, Package, Home, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface OrderTimelineProps {
    status: string;
}

export function OrderTimeline({ status }: OrderTimelineProps) {
    const { t } = useTranslation();

    const stages = [
        { id: 'pending', labelKey: 'orderTracking.timeline.ordered', icon: Package },
        { id: 'accepted', labelKey: 'orderTracking.timeline.accepted', icon: CheckCircle2 },
        { id: 'preparing', labelKey: 'orderTracking.timeline.preparing', icon: Circle },
        { id: 'shipped', labelKey: 'orderTracking.timeline.shipped', icon: Truck },
        { id: 'delivered', labelKey: 'orderTracking.timeline.delivered', icon: Home },
    ];

    if (status === 'rejected') {
        return (
            <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg border border-red-100 dark:bg-red-900/10 dark:border-red-900/20">
                <XCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700 dark:text-red-400 font-medium text-sm">{t('orderTracking.timeline.rejected')}</span>
            </div>
        );
    }

    if (status === 'cancelled') {
        return (
            <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-100 dark:bg-gray-900/10 dark:border-gray-900/20">
                <XCircle className="w-5 h-5 text-gray-500 mr-2" />
                <span className="text-gray-700 dark:text-gray-400 font-medium text-sm">{t('orderTracking.timeline.cancelled')}</span>
            </div>
        );
    }

    const currentIndex = stages.findIndex(s => s.id === status);
    const activeIndex = currentIndex === -1 ? 0 : currentIndex;

    return (
        <div className="w-full py-6">
            <div className="relative flex justify-between">
                {/* Progress Line */}
                <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-800 -z-0" />
                <div
                    className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500 -z-0"
                    style={{ width: `${(activeIndex / (stages.length - 1)) * 100}%` }}
                />

                {stages.map((stage, index) => {
                    const Icon = stage.icon;
                    const isCompleted = index <= activeIndex;
                    const isCurrent = index === activeIndex;

                    return (
                        <div key={stage.id} className="relative z-10 flex flex-col items-center group">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${isCompleted
                                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-white border-gray-200 text-gray-400 dark:bg-gray-950 dark:border-gray-800'
                                    } ${isCurrent ? 'ring-4 ring-primary/20 animate-pulse' : ''}`}
                            >
                                <Icon className="w-5 h-5" />
                            </div>
                            <span className={`mt-2 text-[10px] md:text-sm font-medium transition-colors ${isCompleted ? 'text-primary' : 'text-gray-500'
                                }`}>
                                {t(stage.labelKey, stage.id)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
