import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}) {
  // Combien de poignees dessiner. `_values` ne sert QU'A CA : la valeur reelle est geree par
  // Base UI, a qui on passe `value` tel quel.
  //
  // Le code d'origine (celui livre par shadcn) ne prevoyait que deux cas : un tableau -> autant
  // de poignees, sinon `[min, max]` -> deux poignees, en supposant un curseur d'INTERVALLE. Il
  // oubliait le cas le plus courant : `value={50}`, une valeur unique controlee.
  //
  // Consequence, sur nos deux curseurs (volume et progression) : DEUX poignees etaient
  // dessinees, l'une collee a 0 et l'autre a 100, pour une seule valeur. Le glisser semblait
  // marcher (on attrapait une poignee au hasard), mais la navigation au clavier donnait le focus
  // a la poignee de gauche, coincee sur `min` — et les fleches ne faisaient donc rien.
  //
  // Le contrat de Base UI est pourtant explicite (`SliderRoot.d.ts`) :
  //   onValueChange?: (value: Value extends number ? number : Value, …) => void
  // une valeur nombre donne un nombre, un tableau donne un tableau. On aligne le nombre de
  // poignees sur cette meme regle.
  const _values = Array.isArray(value)
    ? value
    : typeof value === "number"
      ? [value]
      : Array.isArray(defaultValue)
        ? defaultValue
        : typeof defaultValue === "number"
          ? [defaultValue]
          : [min, max]

  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full data-vertical:h-full", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}>
      <SliderPrimitive.Control
        className="relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow overflow-hidden rounded-full bg-muted select-none data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1">
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-primary select-none data-horizontal:h-full data-vertical:w-full" />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className="relative block size-3 shrink-0 rounded-full border border-ring bg-white ring-ring/50 transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50" />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider }
