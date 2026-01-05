import React from "react";
import { Sun, Cloud, CloudRain, Moon } from "lucide-react";
import type { FormData, ClimaType } from "../../types";

interface Props {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
  isReadOnly: boolean;
}

const CondicoesAmbientaisSection: React.FC<Props> = ({
  data,
  onChange,
  isReadOnly,
}) => {
  const handleClimaChange = (
    periodo: "manha" | "tarde" | "noite",
    tipo: ClimaType,
  ) => {
    onChange({
      clima: {
        ...data.clima,
        [periodo]:
          data.clima[periodo] === tipo ? undefined : tipo,
      },
    });
  };

  const ClimaButton: React.FC<{
    periodo: "manha" | "tarde" | "noite";
    tipo: ClimaType;
    icon: React.ReactNode;
    label: string;
  }> = ({ periodo, tipo, icon, label }) => {
    const isSelected = data.clima[periodo] === tipo;

    return (
      <button
        type="button"
        onClick={() =>
          !isReadOnly && handleClimaChange(periodo, tipo)
        }
        disabled={isReadOnly}
        className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
          isSelected
            ? "bg-[#FD5521]/10"
            : "bg-[#F9FAF2] dark:bg-gray-700"
        } ${isReadOnly ? "cursor-default" : "cursor-pointer"}`}
        title={label}
      >
        <div
          className={
            isSelected
              ? "text-[#FD5521]"
              : "text-gray-700 dark:text-gray-400"
          }
        >
          {icon}
        </div>
      </button>
    );
  };

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Condições Ambientais
      </h2>

      <div className="bg-white dark:bg-gray-800 rounded-xl px-6 py-5">
        {/* Clima por período */}
        <div className="space-y-3">
          {/* Manhã */}
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 w-14 flex-shrink-0">
              Manhã
            </div>
            <div className="grid grid-cols-3 gap-2 flex-1">
              <ClimaButton
                periodo="manha"
                tipo="sol"
                icon={<Sun className="w-6 h-6" />}
                label="Sol"
              />
              <ClimaButton
                periodo="manha"
                tipo="nublado"
                icon={<Cloud className="w-6 h-6" />}
                label="Nublado"
              />
              <ClimaButton
                periodo="manha"
                tipo="chuva"
                icon={<CloudRain className="w-6 h-6" />}
                label="Chuva"
              />
            </div>
          </div>

          {/* Tarde */}
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 w-14 flex-shrink-0">
              Tarde
            </div>
            <div className="grid grid-cols-3 gap-2 flex-1">
              <ClimaButton
                periodo="tarde"
                tipo="sol"
                icon={<Sun className="w-6 h-6" />}
                label="Sol"
              />
              <ClimaButton
                periodo="tarde"
                tipo="nublado"
                icon={<Cloud className="w-6 h-6" />}
                label="Nublado"
              />
              <ClimaButton
                periodo="tarde"
                tipo="chuva"
                icon={<CloudRain className="w-6 h-6" />}
                label="Chuva"
              />
            </div>
          </div>

          {/* Noite */}
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 w-14 flex-shrink-0">
              Noite
            </div>
            <div className="grid grid-cols-3 gap-2 flex-1">
              <ClimaButton
                periodo="noite"
                tipo="lua"
                icon={<Moon className="w-6 h-6" />}
                label="Céu limpo"
              />
              <ClimaButton
                periodo="noite"
                tipo="nublado"
                icon={<Cloud className="w-6 h-6" />}
                label="Nublado"
              />
              <ClimaButton
                periodo="noite"
                tipo="chuva"
                icon={<CloudRain className="w-6 h-6" />}
                label="Chuva"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CondicoesAmbientaisSection;