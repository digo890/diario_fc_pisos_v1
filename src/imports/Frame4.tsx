export default function Frame() {
  return (
    <div className="bg-[#edefe3] relative rounded-[9999px] size-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[2px] items-center p-[4px] relative size-full">
          <div className="bg-[#edefe3] content-stretch flex items-center justify-center px-[20px] py-[10px] relative rounded-[2.22222e+10px] shrink-0">
            <p className="font-['Inter:Bold',sans-serif] font-bold leading-[normal] not-italic opacity-40 relative shrink-0 text-[12px] text-black text-nowrap">Não</p>
          </div>
          <div className="bg-[#dbea8d] content-stretch flex items-center justify-center px-[20px] py-[10px] relative rounded-[2.22222e+10px] shrink-0">
            <p className="font-['Inter:Bold',sans-serif] font-bold leading-[normal] not-italic relative shrink-0 text-[12px] text-black text-nowrap">Sim</p>
          </div>
        </div>
      </div>
    </div>
  );
}