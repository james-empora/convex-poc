export function LiquidGlassFilter() {
  return (
    <svg
      className="pointer-events-none absolute h-0 w-0"
      aria-hidden="true"
    >
      <defs>
        <filter
          id="liquid-glass"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
        >
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation="0.4"
            result="blurred"
          />
          <feSpecularLighting
            in="blurred"
            surfaceScale="1.5"
            specularConstant="0.6"
            specularExponent="35"
            lightingColor="white"
            result="specular"
          >
            <fePointLight x="60" y="-20" z="100" />
          </feSpecularLighting>
          <feComposite
            in="specular"
            in2="SourceGraphic"
            operator="in"
            result="specular-masked"
          />
          <feBlend
            in="SourceGraphic"
            in2="specular-masked"
            mode="screen"
          />
        </filter>
      </defs>
    </svg>
  );
}
