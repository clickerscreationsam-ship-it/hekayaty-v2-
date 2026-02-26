import { useTranslation } from "react-i18next";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SortOption } from "@/hooks/use-sort";
import { ListFilter } from "lucide-react";

interface SortSelectorProps {
    value: SortOption;
    onValueChange: (value: SortOption) => void;
    className?: string;
}

export function SortSelector({ value, onValueChange, className }: SortSelectorProps) {
    const { t } = useTranslation();

    return (
        <div className={className}>
            <Select value={value} onValueChange={(v) => onValueChange(v as SortOption)}>
                <SelectTrigger className="w-[200px] bg-black/40 backdrop-blur-md border-white/10 text-white rounded-xl h-11 focus:ring-primary/20">
                    <div className="flex items-center gap-2">
                        <ListFilter className="w-4 h-4 text-white/40" />
                        <SelectValue placeholder={t("common.sortBy")} />
                    </div>
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white rounded-xl">
                    <SelectItem value="default" className="focus:bg-primary focus:text-white">
                        {t("common.all")}
                    </SelectItem>
                    <SelectItem value="price-low-high" className="focus:bg-primary focus:text-white">
                        {t("common.priceLowHigh")}
                    </SelectItem>
                    <SelectItem value="price-high-low" className="focus:bg-primary focus:text-white">
                        {t("common.priceHighLow")}
                    </SelectItem>
                    <SelectItem value="top-rated" className="focus:bg-primary focus:text-white">
                        {t("common.topRated")}
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
