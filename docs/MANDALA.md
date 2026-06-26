# Mandala

## Purpose

The mandala is the Advanced V1 signature visualization. It maps Brishav's skills, tools, and applied domains into one operating diagram that can appear in:

- the Skills section
- terminal output
- the playground summary

## Source of Truth

Mandala data is stored in:

- [`public/assets/data/mandala-config.json`](/D:/tr/public/assets/data/mandala-config.json)

The config contains:

- groups
- nodes
- relationships
- labels
- summaries

## Rendering Model

Advanced V1 uses:

- SVG
- vanilla JavaScript
- CSS animations

This keeps the visualization lightweight, inspectable, and easier to make accessible than a Canvas-first approach.

## Accessibility

The mandala must keep:

- ARIA labels for meaningful nodes
- keyboard focus for interactive nodes
- reduced-motion support
- compact rendering for terminal and mobile use

## Interaction Behavior

- Skills section: full-size visual map with hover/focus detail text
- Terminal: compact embedded version with pulse emphasis
- Playground: dataset-focused highlights using `mandalaFocus`

## V2 Roadmap

Potential future upgrades:

- richer tooltips
- filters by project or domain
- animated transitions between datasets
- deeper narrative overlays
