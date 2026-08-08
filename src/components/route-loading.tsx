export default function RouteLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <div className="flex flex-col items-center justify-center">
        <div className="ag-loading-logo">
          <img
            src="/images/ag-logo.png"
            alt="Loading"
            className="h-[140px] w-[140px] object-contain sm:h-[160px] sm:w-[160px]"
          />
        </div>

        <p className="mt-6 text-sm font-semibold tracking-[0.14em] text-[#1B3A6B]">
          Loading...
        </p>
      </div>
    </div>
  );
}