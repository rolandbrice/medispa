// La carte Google ne se charge qu'au clic : pas de cookies ni de 500 Ko de JS tiers au chargement.
document.querySelectorAll<HTMLElement>('.carte-maps').forEach((bloc) => {
  bloc.querySelector('button')?.addEventListener(
    'click',
    () => {
      const iframe = document.createElement('iframe');
      iframe.src = bloc.dataset.src ?? '';
      iframe.title = bloc.dataset.titre ?? 'Google Maps';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.className = 'absolute inset-0 h-full w-full border-0';
      bloc.replaceChildren(iframe);
    },
    { once: true },
  );
});
