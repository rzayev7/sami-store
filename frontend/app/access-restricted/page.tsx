export const metadata = {
  title: "Access Restricted | SAMI",
};

export default function AccessRestrictedPage() {
  return (
    <section className="mx-auto flex min-h-[56vh] w-full max-w-2xl items-center justify-center py-14">
      <div className="w-full rounded-2xl border border-black/10 bg-white px-6 py-10 text-center shadow-sm sm:px-10 sm:py-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/45">403</p>
        <h1 className="mt-3 font-serif text-3xl text-[var(--color-black)] sm:text-4xl">Access Restricted</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-black/70 sm:text-[15px]">
          Access to this website is currently unavailable from your region. If you believe this is an error, please
          contact support.
        </p>
        <p className="mt-6 text-xs text-black/45">support: samistore.support@gmail.com</p>
      </div>
    </section>
  );
}
