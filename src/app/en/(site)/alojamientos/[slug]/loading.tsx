/**
 * Silueta de la ficha de alojamiento: cabecera clara con el nombre y la
 * tarifa, y debajo la galería (una foto grande y una columna de secundarias).
 * Es la ruta a la que más se navega desde el listado, así que su esqueleto es
 * el que más trabaja.
 */
export default function Loading() {
  return (
    <div className="bg-white pb-16 pt-28 sm:pt-32 lg:pt-36">
      <div className="container-page">
        <div className="h-4 w-56 animate-pulse rounded-full bg-sand" />

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="h-12 w-64 animate-pulse rounded-full bg-sand sm:h-14 sm:w-80" />
            <div className="mt-4 flex flex-wrap gap-2">
              {["w-32", "w-40", "w-36", "w-28"].map((width) => (
                <div
                  key={width}
                  className={`h-8 animate-pulse rounded-full bg-sand ${width}`}
                />
              ))}
            </div>
          </div>
          <div className="h-12 w-48 animate-pulse rounded-full bg-sand" />
        </div>

        <div className="mt-9 grid gap-3 sm:gap-4 lg:grid-cols-3">
          <div className="aspect-[4/3] animate-pulse rounded-card bg-sand lg:col-span-2 lg:aspect-[3/2]" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-1 lg:grid-rows-3">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className={`animate-pulse rounded-card bg-sand lg:h-full ${
                  index === 2 ? "col-span-2 aspect-[16/9] lg:aspect-auto" : "aspect-[4/3] lg:aspect-auto"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
