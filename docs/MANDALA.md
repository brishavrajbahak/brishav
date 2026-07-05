# Mandala Notes

The mandala is the most deliberate visual addition in Advanced V1.

I used it because I wanted one artifact on the site that shows relationships, not just a list of tools.

## What it renders

The mandala maps:

- core identity
- skills
- tools
- applied domains

The source of truth is [`public/assets/data/mandala-config.json`](/D:/tr/public/assets/data/mandala-config.json).

## Why SVG

I chose SVG with vanilla JavaScript instead of a canvas-heavy approach because SVG is easier to inspect, easier to style, and easier to make accessible.

That matters here because the mandala is not decorative filler. It is part of the explanation layer of the site.

## Where it appears

- the Skills section
- the terminal `mandala` command
- the playground result area

## Accessibility expectations

The mandala needs to stay usable with:

- keyboard focus on interactive nodes
- meaningful ARIA labels
- reduced-motion handling
- readable detail text when a node is focused or activated

## What I need to be able to explain

If I am asked about this module, I should be able to explain:

- how the config is loaded
- how node positions are calculated
- how focus expansion works
- how compact and full-size views differ
- how keyboard activation updates the detail panel
