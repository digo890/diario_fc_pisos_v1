import svgPaths from "./svg-jptud7qz5j";

export default function TextInput() {
  return (
    <div className="bg-white relative rounded-[14px] size-full" data-name="Text Input">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[6px] items-center overflow-clip px-[16px] py-[12px] relative size-full">
          <div className="relative shrink-0 size-[20px]" data-name="lucide/user-round">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
              <g id="lucide/user-round">
                <path d={svgPaths.p130de5a0} id="Vector" stroke="var(--stroke-0, #C6CCC2)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
              </g>
            </svg>
          </div>
          <p className="font-['Arimo:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#888a81] text-[16px] text-nowrap">Nome completo</p>
        </div>
      </div>
    </div>
  );
}