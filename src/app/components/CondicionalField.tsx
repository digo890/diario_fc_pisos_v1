import React, { useRef } from 'react';
import { CondicionalItem } from '../types';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Camera, Image as ImageIcon, X } from 'lucide-react';

interface CondicionalFieldProps {
  label: string;
  value: CondicionalItem;
  onChange: (value: CondicionalItem) => void;
  disabled?: boolean;
}

export function CondicionalField({ label, value, onChange, disabled = false }: CondicionalFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRespostaChange = (resposta: boolean) => {
    if (disabled) return;
    onChange({
      ...value,
      resposta,
      comentario: resposta ? value.comentario : '',
      foto: resposta ? value.foto : null,
    });
  };

  const handleComentarioChange = (comentario: string) => {
    if (disabled) return;
    onChange({ ...value, comentario });
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ ...value, foto: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFoto = () => {
    if (disabled) return;
    onChange({ ...value, foto: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCameraClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3 p-4 border border-border rounded-xl">
      <Label>{label}</Label>
      
      {/* Switch Não/Sim - Design tipo toggle */}
      <div className="bg-[#edefe3] dark:bg-gray-800 rounded-full p-1 relative">
        {/* Background verde que desliza */}
        <div 
          className={`absolute top-1 bottom-1 left-1 right-1 w-[calc(50%-4px)] bg-[#DBEA8D] dark:bg-[#DBEA8D] rounded-full transition-transform duration-300 ease-in-out ${
            value.resposta === true ? 'translate-x-full' : 'translate-x-0'
          }`}
        />
        
        {/* Botões de texto */}
        <div className="relative flex">
          <button
            type="button"
            onClick={() => value.resposta !== false && handleRespostaChange(false)}
            disabled={disabled}
            className={`w-1/2 px-5 py-2.5 rounded-full text-xs font-bold transition-opacity duration-300 disabled:cursor-not-allowed z-10 ${
              value.resposta === false
                ? 'text-black opacity-100'
                : 'text-black dark:text-gray-400 opacity-40'
            }`}
          >
            Não
          </button>
          <button
            type="button"
            onClick={() => value.resposta !== true && handleRespostaChange(true)}
            disabled={disabled}
            className={`w-1/2 px-5 py-2.5 rounded-full text-xs font-bold transition-opacity duration-300 disabled:cursor-not-allowed z-10 ${
              value.resposta === true
                ? 'text-black opacity-100'
                : 'text-black dark:text-gray-400 opacity-40'
            }`}
          >
            Sim
          </button>
        </div>
      </div>

      {/* Campos condicionais - apenas se Sim */}
      {value.resposta === true && (
        <div className="space-y-3 pt-2">
          <div className="space-y-2">
            <Label className="text-sm">Detalhes / Onde / Comentário</Label>
            <Textarea
              value={value.comentario}
              onChange={(e) => handleComentarioChange(e.target.value)}
              placeholder="Descreva os detalhes..."
              className="min-h-20"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Foto (opcional)</Label>
            
            {value.foto ? (
              <div className="relative">
                <img
                  src={value.foto}
                  alt="Anexo"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-40 object-cover rounded-lg border border-border"
                />
                {!disabled && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveFoto}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ) : (
              !disabled && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12"
                    onClick={handleCameraClick}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Câmera
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12"
                    onClick={handleCameraClick}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Galeria
                  </Button>
                </div>
              )
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFotoChange}
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
}