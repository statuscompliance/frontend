import { defineConfig, presetWind3, transformerVariantGroup, transformerDirectives } from 'unocss';
import { presetAnimations } from 'unocss-preset-animations';

export default defineConfig({
  content: {
    pipeline: {
      include: [
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        'src/**/*.{js,ts}',
      ],
      exclude: ['**/*.config.{js,ts}', 'node_modules', 'dist']
    },
  },
  presets: [
    presetWind3({
      preflight: 'on-demand'
    }),
    /**
     * TODO: Investigate alternative to this plugin. It's not as maintained as its
     * tailwindcss-animate counterpart
     */
    presetAnimations()
  ],
  transformers: [
    transformerVariantGroup(),
    transformerDirectives()
  ],
  theme: {
    borderRadius: {
      lg: 'var(--radius)',
      md: 'calc(var(--radius) - 2px)',
      sm: 'calc(var(--radius) - 4px)'
    },
    colors: {
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      card: {
        DEFAULT: 'hsl(var(--card))',
        foreground: 'hsl(var(--card-foreground))'
      },
      popover: {
        DEFAULT: 'hsl(var(--popover))',
        foreground: 'hsl(var(--popover-foreground))'
      },
      primary: {
        DEFAULT: 'hsl(var(--primary))',
        foreground: 'hsl(var(--primary-foreground))'
      },
      secondary: {
        DEFAULT: 'hsl(var(--secondary))',
        foreground: 'hsl(var(--secondary-foreground))'
      },
      muted: {
        DEFAULT: 'hsl(var(--muted))',
        foreground: 'hsl(var(--muted-foreground))'
      },
      accent: {
        DEFAULT: 'hsl(var(--accent))',
        foreground: 'hsl(var(--accent-foreground))'
      },
      destructive: {
        DEFAULT: 'hsl(var(--destructive))',
        foreground: 'hsl(var(--destructive-foreground))'
      },
      border: 'hsl(var(--border))',
      input: 'hsl(var(--input))',
      ring: 'hsl(var(--ring))',
      chart: {
        '1': 'hsl(var(--chart-1))',
        '2': 'hsl(var(--chart-2))',
        '3': 'hsl(var(--chart-3))',
        '4': 'hsl(var(--chart-4))',
        '5': 'hsl(var(--chart-5))'
      },
      sidebar: {
        DEFAULT: 'hsl(var(--sidebar-background))',
        foreground: 'hsl(var(--sidebar-foreground))',
        primary: {
          DEFAULT: 'hsl(var(--sidebar-primary))',
          foreground: 'hsl(var(--sidebar-primary-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--sidebar-accent))',
          foreground: 'hsl(var(--sidebar-accent-foreground))'
        },
        border: 'hsl(var(--sidebar-border))',
        ring: 'hsl(var(--sidebar-ring))'
      }
    },
    animation: {
      keyframes: {
        'accordion-down': '{from{height:0}to{height:var(--radix-accordion-content-height)}}',
        'accordion-up': '{from{height:var(--radix-accordion-content-height)}to{height:0}}',
        'caret-blink': '{0%,70%,100%{opacity:1}20%,50%{opacity:0}}',
      },
      durations: {
        'accordion-down': '0.2s',
        'accordion-up': '0.2s',
        'caret-blink': '1.25s',
      },
      timingFns: {
        'accordion-down': 'ease-out',
        'accordion-up': 'ease-out',
        'caret-blink': 'ease-out',
      },
      counts: {
        'caret-blink': 'infinite',
      },
    }
  }
});
