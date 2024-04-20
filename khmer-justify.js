const NEWLINE = '\n'
const segmenter = new Intl.Segmenter(undefined, { granularity: "word" });

const randomColor = (() => {
  const randint = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  return () => {
    var h = randint(0, 360);
    var s = randint(42, 98);
    var l = 85;
    return `hsl(${h},${s}%,${l}%)`;
  };
})();

function trimWhitespaces(line) {
  return line.filter((v, i) =>
    (i !== 0 && i !== line.length - 1) || !v.isWhitespace
  );
}

export class TextLayer {

  constructor(text, props = {}) {
    this.text = text;
    this.segments = Array.from(segmenter.segment(text))
    this.props = props;
  }

  /**
   * @param {import("@napi-rs/canvas").SKRSContext2D} ctx 
   */
  layout(ctx) {
    const props = this.props;
    ctx.font = props.font;

    let textAlign = typeof props.textAlign === 'string' ?
      props.textAlign.toLowerCase() : "left"

    if (textAlign === "start") {
      textAlign = "left"
    }

    if (textAlign === "end") {
      textAlign = "right"
    }


    let maxWidth = typeof props.width === 'number' ? props.width : Infinity;
    let lineHeight = typeof props.lineHeight === 'number' ? props.lineHeight : 1.0;

    const components = [];
    for (const { segment, isWordLike } of this.segments) {
      const metrics = ctx.measureText(segment);

      const segmentHeight = (metrics.alphabeticBaseline * 2) + (
        metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent
      );

      components.push({
        segment,
        isWhitespace: segment.trim().length === 0,
        isWordLike,
        w: metrics.width,
        h: segmentHeight,
        top: metrics.alphabeticBaseline * 2,
      });
    }

    // lines
    const lines = [];
    let x = this.props.x;
    let lastPosition = 0;

    for (let i = 0; i < components.length; i++) {

      let linebreak = false;
      const component = components[i];

      if (component.segment === NEWLINE) {
        linebreak = true;
      }

      x += component.w;
      if (i < components.length - 1 && !linebreak) {
        if (x + components[i + 1].w >= maxWidth + this.props.x) {
          linebreak = true;
        }
      }

      if (linebreak) {
        lines.push({
          h: component.h,
          children: trimWhitespaces(components.slice(lastPosition, i + 1)),
          force: component.segment === NEWLINE,
        });

        x = this.props.x;
        lastPosition = i + 1;
      }
    }

    if (lastPosition < components.length) {
      lines.push({
        h: components[components.length - 1].h,
        children: trimWhitespaces(components.slice(lastPosition)),
      });
    }

    x = props.x;
    let y = props.y;

    const groups = [];

    for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {

      const line = lines[lineNumber];
      const numOfWhitespaces = line.children.filter(i => i.isWhitespace).length;
      const lineWidthWithoutSpace =
        line.children.filter(i => !i.isWhitespace).reduce((prev, cur) => prev + cur.w, 0);

      const lineWidth = line.children.reduce((prev, cur) => prev + cur.w, 0);
      const spaceSize = (maxWidth - lineWidthWithoutSpace) / numOfWhitespaces;
      const isLastLine = (lineNumber === lines.length - 1) || (line.force) || (lineWidth < (maxWidth * 0.75))

      let actualLineWidth = 0;
      let offsetWidth = 0;

      if (maxWidth !== Infinity) {
        if (textAlign === "right") {
          offsetWidth = maxWidth - lineWidth;
        }

        if (textAlign === "center") {
          offsetWidth = (maxWidth - lineWidth) / 2;
        }
      }

      x += offsetWidth;
      const objects = [];

      for (let i = 0; i < line.children.length; i++) {
        const component = line.children[i];

        if (textAlign === "justify") {
          if (component.isWhitespace && !isLastLine) {
            component.w = spaceSize;
          }
        }

        objects.push({
          text: component.segment,
          bbox: {
            w: component.w,
            h: component.h,
            x,
            y,
          },
          ws: component.isWhitespace,
          x,
          y: y + component.top,
          actualY: y,
        });

        x += component.w;
        actualLineWidth += component.w;
      }

      groups.push({
        bbox: {
          w: actualLineWidth,
          h: line.h,
          x: props.x + offsetWidth,
          y: y,
        },
        objects,
      });

      if (lineNumber < lines.length - 1) {
        y += line.h * lineHeight
        x = props.x;
      } else {
        y += line.h
      }
    }

    const bbox = {
      w: maxWidth === Infinity ? x - props.x : maxWidth,
      h: y - props.y,
      x: props.x,
      y: props.y,
      left: props.x,
      top: props.y,
      right: props.x + (maxWidth === Infinity ? x - props.x : maxWidth),
      bottom: y,
    }

    return {
      ...bbox,
      groups,
      props,
      fill() {

        if (props.fillStyle) {
          ctx.fillStyle = props.fillStyle;
        }

        for (const group of groups) {
          for (const { x, y, text, ws, bbox } of group.objects) {
            if (props.debug) {
              ctx.save();
              if (!ws) {
                ctx.fillStyle = randomColor();
                ctx.fillRect(bbox.x, bbox.y, bbox.w, bbox.h);
              } else {
                ctx.fillStyle = 'hsl(160, 50%, 90%)';
                ctx.fillRect(bbox.x, bbox.y, bbox.w, bbox.h);
              }
              ctx.restore()
            }
            ctx.fillText(text, x, y);
          }

          if (props.debug) {
            const bbox = group.bbox;
            if (bbox.w > 0) {
              ctx.save()
              ctx.strokeStyle = 'blue';
              ctx.strokeRect(bbox.x, bbox.y, bbox.w, bbox.h);
              ctx.restore()
            }
          }
        }

        if (props.debug) {
          ctx.save()
          ctx.strokeStyle = 'magenta';
          ctx.strokeRect(bbox.x, bbox.y, bbox.w, bbox.h);
          ctx.restore();
        }

        return this;
      },
    }
  }
}
