import svgPaths from "./svg-8pn4t1cw0i";
import clsx from "clsx";

function Wrapper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="content-stretch flex items-center px-[24px] py-[32px] relative shrink-0 w-[1100px]">
      <div aria-hidden="true" className="absolute border border-[#ccc] border-solid inset-0 pointer-events-none" />
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[24px] not-italic relative shrink-0 text-[24px] text-black text-nowrap">{children}</p>
    </div>
  );
}
type TextProps = {
  text: string;
  additionalClassNames?: string;
};

function Text({ text, additionalClassNames = "" }: TextProps) {
  return (
    <div className={clsx("content-stretch flex items-center px-[24px] py-[32px] relative shrink-0", additionalClassNames)}>
      <div aria-hidden="true" className="absolute border border-[#ccc] border-solid inset-0 pointer-events-none" />
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[24px] not-italic relative shrink-0 text-[24px] text-black text-nowrap">{text}</p>
    </div>
  );
}

export default function Pdf() {
  return (
    <div className="bg-white relative size-full" data-name="PDF">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[24px] left-[140px] not-italic text-[40px] text-black text-nowrap top-[320px]">Dados da Obra</p>
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[24px] left-[140px] not-italic text-[40px] text-black text-nowrap top-[723px]">Serviço 1</p>
      <div className="absolute contents left-[140px] top-[795px]">
        <div className="absolute bg-[#fd5521] h-[85px] left-[140px] top-[795px] w-[2200px]" />
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[24px] left-[164px] not-italic text-[24px] text-nowrap text-white top-[826px]">Item</p>
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[24px] left-[1275px] not-italic text-[24px] text-nowrap text-white top-[826px]">Valor</p>
      </div>
      <div className="absolute content-stretch flex flex-col items-start left-[140px] top-[880px] w-[2200px]">
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Text text="Horário de execução" additionalClassNames="w-[1100px]" />
          <Text text="07h 30 min" additionalClassNames="w-[1100px]" />
        </div>
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Text text="Local de execução" additionalClassNames="w-[1100px]" />
          <Text text="Garagem" additionalClassNames="w-[1100px]" />
        </div>
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Text text="1. Temperatura Ambiente" additionalClassNames="w-[1100px]" />
          <Text text="22°C" additionalClassNames="w-[1100px]" />
        </div>
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Text text="2. Umidade Relativa do Ar" additionalClassNames="w-[1100px]" />
          <Text text="60%" additionalClassNames="w-[1100px]" />
        </div>
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Text text="3. Temperatura do Substrato" additionalClassNames="w-[1100px]" />
          <Text text="24°C" additionalClassNames="w-[1100px]" />
        </div>
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Text text="4. Umidade Superficial do Substrato" additionalClassNames="w-[1100px]" />
          <Text text="6%" additionalClassNames="w-[1100px]" />
        </div>
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Text text="5. Temperatura da Mistura" additionalClassNames="w-[1100px]" />
          <Text text="22°C" additionalClassNames="w-[1100px]" />
        </div>
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Text text="6. Tempo de Mistura" additionalClassNames="w-[1100px]" />
          <Text text="2 minutos" additionalClassNames="w-[1100px]" />
        </div>
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Text text="7. Nº dos Lotes da Parte 1" additionalClassNames="w-[1100px]" />
          <Text text="12345" additionalClassNames="w-[1100px]" />
        </div>
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Text text="8. Nº dos Lotes da Parte 2" additionalClassNames="w-[1100px]" />
          <Text text="12346" additionalClassNames="w-[1100px]" />
        </div>
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Text text="9. Nº dos Lotes da Parte 3" additionalClassNames="w-[1100px]" />
          <Text text="12347" additionalClassNames="w-[1100px]" />
        </div>
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Text text="10. Nº de Kits Gastos" additionalClassNames="w-[1100px]" />
          <Text text="8" additionalClassNames="w-[1100px]" />
        </div>
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Text text="11. Consumo Médio Obtido" additionalClassNames="w-[1100px]" />
          <Text text="5m²/Kit" additionalClassNames="w-[1100px]" />
        </div>
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Text text="12. Consumo Médio Especificado" additionalClassNames="w-[1100px]" />
          <Text text="4m²/Kit" additionalClassNames="w-[1100px]" />
        </div>
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Text text="13. Preparo de Substrato" additionalClassNames="w-[1100px]" />
          <Text text="149m²/ml" additionalClassNames="w-[1100px]" />
        </div>
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Text text="14. Aplicação de Primer ou TC-302" additionalClassNames="w-[1100px]" />
          <Text text="89m²/ml" additionalClassNames="w-[1100px]" />
        </div>
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Text text="15. Aplicação de Uretano" additionalClassNames="w-[1100px]" />
          <Text text="2 tipos selecionados" additionalClassNames="w-[1100px]" />
        </div>
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Wrapper>{`> Uretano argamassado 4mm`}</Wrapper>
          <Text text="5m²" additionalClassNames="w-[1100px]" />
        </div>
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Wrapper>{`> Uretano argamassado 6mm`}</Wrapper>
          <Text text="6m²" additionalClassNames="w-[1100px]" />
        </div>
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Text text="16. Aplicação de Uretano WR em Muretas" additionalClassNames="w-[1100px]" />
          <Text text="Uretano argamassado 4mm" additionalClassNames="w-[550px]" />
          <Text text="10ml" additionalClassNames="w-[550px]" />
        </div>
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Text text="17. Aplicação Rodapés" additionalClassNames="w-[1100px]" />
          <Text text="Uretano para rodapé" additionalClassNames="w-[550px]" />
          <Text text="10ml" additionalClassNames="w-[550px]" />
        </div>
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Text text="18. Aplicação de Uretano WR em Paredes" additionalClassNames="w-[1100px]" />
          <Text text="Uretano para muretas" additionalClassNames="w-[550px]" />
          <Text text="10ml" additionalClassNames="w-[550px]" />
        </div>
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Text text="19. Aplicação de uretano em muretas" additionalClassNames="w-[1100px]" />
          <Text text="10ml" additionalClassNames="w-[550px]" />
          <Text text="10cm" additionalClassNames="w-[550px]" />
        </div>
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Text text="20. Serviços de pintura" additionalClassNames="w-[1100px]" />
          <Text text="Pintura em isopainel (parede)" additionalClassNames="w-[550px]" />
          <Text text="6m²" additionalClassNames="w-[550px]" />
        </div>
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Text text="21. Serviços de pintura de layout" additionalClassNames="w-[1100px]" />
          <Text text="Faixas de 10cm" additionalClassNames="w-[550px]" />
          <Text text="10ml" additionalClassNames="w-[550px]" />
        </div>
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Text text="22. Aplicação de Epóxi" additionalClassNames="w-[1100px]" />
          <Text text="15m²" additionalClassNames="w-[1100px]" />
        </div>
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Text text="23. Corte / Selamento Juntas de Piso" additionalClassNames="w-[1100px]" />
          <Text text="10ml" additionalClassNames="w-[1100px]" />
        </div>
      </div>
      <div className="absolute content-stretch flex font-['Inter:Medium',sans-serif] font-medium items-center justify-between leading-[24px] left-[140px] not-italic text-[24px] text-black text-nowrap top-[3389px] w-[2200px]">
        <p className="relative shrink-0">FC Pisos - Gerado em 06/01/2026 às 17:51</p>
        <p className="relative shrink-0">Página 1 de 4</p>
      </div>
      <div className="absolute contents left-[140px] top-[392px]" data-name="cabeçalio">
        <div className="absolute contents left-[140px] top-[558px]">
          <div className="absolute bg-[#f5f5f5] border-2 border-[#ccc] border-solid h-[85px] left-[140px] top-[558px] w-[733px]" />
          <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-[164px] not-italic text-[24px] text-black text-nowrap top-[589px]">
            <span>{`Encarregado: `}</span>
            <span className="font-['Inter:Bold',sans-serif] font-bold">Nome do encarregado</span>
          </p>
        </div>
        <div className="absolute contents left-[871px] top-[558px]">
          <div className="absolute bg-[#f5f5f5] border-2 border-[#ccc] border-solid h-[85px] left-[871px] top-[558px] w-[738px]" />
          <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-[895px] not-italic text-[24px] text-black text-nowrap top-[589px]">
            <span>{`Preposto: `}</span>
            <span className="font-['Inter:Bold',sans-serif] font-bold">Nome do Preposto</span>
          </p>
          <div className="absolute bg-[#f5f5f5] border-2 border-[#ccc] border-solid h-[85px] left-[1602px] top-[558px] w-[738px]" />
          <div className="absolute content-stretch flex gap-[12px] items-center left-[1626px] top-[589px]">
            <div className="relative shrink-0 size-[24px]" data-name="lucide/circle-check-big">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                <g clipPath="url(#clip0_203_204)" id="lucide/circle-check-big">
                  <path d={svgPaths.pbee9580} id="Vector" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                </g>
                <defs>
                  <clipPath id="clip0_203_204">
                    <rect fill="white" height="24" width="24" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <p className="font-['Inter:Bold',sans-serif] font-bold leading-[24px] not-italic relative shrink-0 text-[24px] text-black text-nowrap">Autenticado pelo preposto</p>
          </div>
        </div>
        <div className="absolute contents left-[140px] top-[475px]">
          <div className="absolute bg-[#f5f5f5] border-2 border-[#ccc] border-solid h-[85px] left-[140px] top-[475px] w-[733px]" />
          <div className="absolute bg-white border-2 border-[#ccc] border-solid h-[85px] left-[871px] top-[475px] w-[1469px]" />
          <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-[164px] not-italic text-[24px] text-black text-nowrap top-[506px]">Condições ambientais</p>
          <div className="absolute content-stretch flex gap-[24px] items-center left-[895px] top-[499px]">
            <p className="font-['Inter:Medium',sans-serif] font-medium leading-[24px] not-italic relative shrink-0 text-[24px] text-black text-nowrap">
              <span>{`Manhã: `}</span>
              <span className="font-['Inter:Bold',sans-serif] font-bold">Sol</span>
            </p>
            <div className="bg-[#ccc] h-[37px] shrink-0 w-[2px]" />
            <p className="font-['Inter:Medium',sans-serif] font-medium leading-[24px] not-italic relative shrink-0 text-[24px] text-black text-nowrap">
              <span>{`Tarde: `}</span>
              <span className="font-['Inter:Bold',sans-serif] font-bold">Nublado</span>
            </p>
            <div className="bg-[#ccc] h-[37px] shrink-0 w-[2px]" />
            <p className="font-['Inter:Medium',sans-serif] font-medium leading-[24px] not-italic relative shrink-0 text-[24px] text-black text-nowrap">
              <span>{`Noite: `}</span>
              <span className="font-['Inter:Bold',sans-serif] font-bold">Chuva</span>
            </p>
          </div>
        </div>
        <div className="absolute contents left-[140px] top-[392px]">
          <div className="absolute bg-white border-2 border-[#ccc] border-solid h-[85px] left-1/2 top-[392px] translate-x-[-50%] w-[738px]" />
          <div className="absolute bg-white border-2 border-[#ccc] border-solid h-[85px] left-[calc(50%+733.5px)] top-[392px] translate-x-[-50%] w-[733px]" />
          <div className="absolute bg-white border-2 border-[#ccc] border-solid h-[85px] left-[140px] top-[392px] w-[733px]" />
          <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-[164px] not-italic text-[24px] text-black text-nowrap top-[422.5px]">
            <span>{`Cliente: `}</span>
            <span className="font-['Inter:Bold',sans-serif] font-bold">Adidas</span>
          </p>
          <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-[895px] not-italic text-[24px] text-black text-nowrap top-[422.5px]">
            <span>{`Obra: `}</span>
            <span className="font-['Inter:Bold',sans-serif] font-bold">Garagem</span>
          </p>
          <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-[1631px] not-italic text-[24px] text-black text-nowrap top-[422.5px]">
            <span>{`Cidade: `}</span>
            <span className="font-['Inter:Bold',sans-serif] font-bold">São Paulo/ SP</span>
          </p>
        </div>
      </div>
      <div className="absolute contents left-0 top-0" data-name="topo">
        <div className="absolute bg-[#fd5521] h-[240px] left-0 top-0 w-[2480px]" />
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[24px] left-[80px] not-italic text-[40px] text-nowrap text-white top-[80px]">Diário de Obras - FC PISOS</p>
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[24px] left-[80px] not-italic text-[32px] text-nowrap text-white top-[136px]">Pisos e Revestimentos Industriais Ltda.</p>
        <p className="absolute font-['Arimo:Bold',sans-serif] font-bold leading-[24px] left-[1907px] not-italic text-[32px] text-nowrap text-white top-[80px]">
          <span className="font-['Inter:Regular',sans-serif] font-normal">Preenchimento:</span>
          <span className="font-['Inter:Bold',sans-serif]">{` 05/01/2026`}</span>
        </p>
        <p className="absolute font-['Arimo:Bold',sans-serif] font-bold leading-[24px] left-[1907px] not-italic text-[32px] text-nowrap text-white top-[136px]">
          <span className="font-['Inter:Regular',sans-serif] font-normal">ID da Obra:</span>
          <span className="font-['Inter:Bold',sans-serif]">{` #12345`}</span>
        </p>
      </div>
    </div>
  );
}