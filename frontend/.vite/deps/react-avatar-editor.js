import {
  require_react
} from "./chunk-VX2H6PUQ.js";
import {
  __toESM
} from "./chunk-G3PMV62Z.js";

// node_modules/react-avatar-editor/dist/index.mjs
var import_react = __toESM(require_react(), 1);
var s = (e2, t2, n2, r2, i2, a2) => {
  if (a2 === 0) e2.rect(t2, n2, r2, i2);
  else {
    let o2 = r2 - a2, s2 = i2 - a2;
    e2.translate(t2, n2), e2.arc(a2, a2, a2, Math.PI, Math.PI * 1.5), e2.lineTo(o2, 0), e2.arc(o2, a2, a2, Math.PI * 1.5, Math.PI * 2), e2.lineTo(r2, s2), e2.arc(o2, s2, a2, Math.PI * 2, Math.PI * 0.5), e2.lineTo(a2, i2), e2.arc(a2, s2, a2, Math.PI * 0.5, Math.PI), e2.closePath(), e2.translate(-t2, -n2);
  }
};
var c = (e2, t2, n2, r2, i2, a2) => {
  e2.fillStyle = a2;
  let o2 = r2 / 3, s2 = i2 / 3;
  e2.fillRect(t2, n2, 1, i2), e2.fillRect(o2 + t2, n2, 1, i2), e2.fillRect(o2 * 2 + t2, n2, 1, i2), e2.fillRect(o2 * 3 + t2, n2, 1, i2), e2.fillRect(o2 * 4 + t2, n2, 1, i2), e2.fillRect(t2, n2, r2, 1), e2.fillRect(t2, s2 + n2, r2, 1), e2.fillRect(t2, s2 * 2 + n2, r2, 1), e2.fillRect(t2, s2 * 3 + n2, r2, 1), e2.fillRect(t2, s2 * 4 + n2, r2, 1);
};
var l = (e2) => !!e2.match(/^\s*data:([a-z]+\/[a-z]+(;[a-z-]+=[a-z-]+)?)?(;base64)?,[a-z0-9!$&',()*+;=\-._~:@/?%\s]*\s*$/i);
var u = (e2, t2) => new Promise((n2, r2) => {
  let i2 = new Image();
  i2.addEventListener("load", () => n2(i2)), i2.addEventListener("error", r2), !l(e2) && t2 && (i2.crossOrigin = t2), i2.src = e2;
});
var d = (e2) => new Promise((t2, n2) => {
  let r2 = new FileReader();
  r2.addEventListener("load", (e3) => {
    try {
      if (!e3?.target?.result) throw Error("No image data");
      t2(u(e3.target.result));
    } catch (e4) {
      n2(e4);
    }
  }), r2.readAsDataURL(e2);
});
var f = typeof File < "u";
var p = (e2) => Math.PI / 180 * e2;
var m = {
  x: 0.5,
  y: 0.5
};
var h = class {
  constructor(e2) {
    this.imageState = m, this.config = {
      border: 25,
      borderRadius: 0,
      scale: 1,
      rotate: 0,
      color: [
        0,
        0,
        0,
        0.5
      ],
      backgroundColor: "",
      borderColor: void 0,
      showGrid: false,
      gridColor: "#666",
      disableBoundaryChecks: false,
      disableHiDPIScaling: false,
      disableCanvasRotation: true,
      crossOrigin: void 0,
      ...e2
    }, this.pixelRatio = typeof window < "u" && window.devicePixelRatio && !this.config.disableHiDPIScaling ? window.devicePixelRatio : 1;
  }
  getPixelRatio() {
    return this.pixelRatio;
  }
  getImageState() {
    return this.imageState;
  }
  setImageState(e2) {
    this.imageState = e2;
  }
  updateConfig(e2) {
    this.config = {
      ...this.config,
      ...e2
    };
  }
  isVertical() {
    return !this.config.disableCanvasRotation && this.config.rotate % 180 != 0;
  }
  getBorders(e2) {
    let t2 = e2 ?? this.config.border;
    return Array.isArray(t2) ? t2 : [t2, t2];
  }
  getDimensions() {
    let { width: e2, height: t2, rotate: n2, border: r2 } = this.config, i2 = {
      width: 0,
      height: 0
    }, [a2, o2] = this.getBorders(r2);
    return this.isVertical() ? (i2.width = t2, i2.height = e2) : (i2.width = e2, i2.height = t2), i2.width += a2 * 2, i2.height += o2 * 2, {
      canvas: i2,
      rotate: n2,
      width: e2,
      height: t2,
      border: r2
    };
  }
  getXScale() {
    if (!this.imageState.width || !this.imageState.height) throw Error("Image dimension is unknown.");
    let e2 = this.config.width / this.config.height, t2 = this.imageState.width / this.imageState.height;
    return Math.min(1, e2 / t2);
  }
  getYScale() {
    if (!this.imageState.width || !this.imageState.height) throw Error("Image dimension is unknown.");
    let e2 = this.config.height / this.config.width, t2 = this.imageState.height / this.imageState.width;
    return Math.min(1, e2 / t2);
  }
  getCroppingRect(e2) {
    if (!this.imageState.width || !this.imageState.height) return {
      x: 0,
      y: 0,
      width: 1,
      height: 1
    };
    let t2 = e2 || {
      x: this.imageState.x,
      y: this.imageState.y
    }, n2 = 1 / this.config.scale * this.getXScale(), r2 = 1 / this.config.scale * this.getYScale(), i2 = {
      x: t2.x - n2 / 2,
      y: t2.y - r2 / 2,
      width: n2,
      height: r2
    }, a2 = 0, o2 = 1 - i2.width, s2 = 0, c2 = 1 - i2.height;
    return (this.config.disableBoundaryChecks || n2 > 1 || r2 > 1) && (a2 = -i2.width, o2 = 1, s2 = -i2.height, c2 = 1), {
      ...i2,
      x: Math.max(a2, Math.min(i2.x, o2)),
      y: Math.max(s2, Math.min(i2.y, c2))
    };
  }
  getInitialSize(e2, t2) {
    let n2, r2, i2 = this.getDimensions();
    return i2.height / i2.width > t2 / e2 ? (n2 = i2.height, r2 = n2 / t2 * e2) : (r2 = i2.width, n2 = r2 / e2 * t2), {
      height: n2,
      width: r2
    };
  }
  async loadImage(e2) {
    let t2;
    if (f && e2 instanceof File) t2 = await d(e2);
    else if (typeof e2 == "string") t2 = await u(e2, this.config.crossOrigin);
    else throw Error("Invalid image source");
    let n2 = {
      ...this.getInitialSize(t2.width, t2.height),
      resource: t2,
      x: 0.5,
      y: 0.5
    };
    return this.imageState = n2, n2;
  }
  clearImage() {
    this.imageState = m;
  }
  calculatePosition(e2 = this.imageState, t2) {
    let [n2, r2] = this.getBorders(t2);
    if (!e2.width || !e2.height) throw Error("Image dimension is unknown.");
    let i2 = this.getCroppingRect(), a2 = e2.width * this.config.scale, o2 = e2.height * this.config.scale, s2 = -i2.x * a2, c2 = -i2.y * o2;
    return this.isVertical() ? (s2 += r2, c2 += n2) : (s2 += n2, c2 += r2), {
      x: s2,
      y: c2,
      height: o2,
      width: a2
    };
  }
  paint(e2) {
    e2.save(), e2.scale(this.pixelRatio, this.pixelRatio), e2.translate(0, 0), e2.fillStyle = "rgba(" + this.config.color.slice(0, 4).join(",") + ")";
    let t2 = this.config.borderRadius, n2 = this.getDimensions(), [r2, i2] = this.getBorders(n2.border), a2 = n2.canvas.height, o2 = n2.canvas.width;
    t2 = Math.max(t2, 0), t2 = Math.min(t2, o2 / 2 - r2, a2 / 2 - i2), e2.beginPath(), s(e2, r2, i2, o2 - r2 * 2, a2 - i2 * 2, t2), e2.rect(o2, 0, -o2, a2), e2.fill("evenodd"), this.config.borderColor && (e2.strokeStyle = "rgba(" + this.config.borderColor.slice(0, 4).join(",") + ")", e2.lineWidth = 1, e2.beginPath(), s(e2, r2 + 0.5, i2 + 0.5, o2 - r2 * 2 - 1, a2 - i2 * 2 - 1, t2), e2.stroke()), this.config.showGrid && c(e2, r2, i2, o2 - r2 * 2, a2 - i2 * 2, this.config.gridColor), e2.restore();
  }
  paintImage(e2, t2, n2, r2 = this.pixelRatio) {
    if (!t2.resource) return;
    let i2 = this.calculatePosition(t2, n2);
    e2.save(), e2.translate(e2.canvas.width / 2, e2.canvas.height / 2), e2.rotate(this.config.rotate * Math.PI / 180), e2.translate(-(e2.canvas.width / 2), -(e2.canvas.height / 2)), this.isVertical() && e2.translate((e2.canvas.width - e2.canvas.height) / 2, (e2.canvas.height - e2.canvas.width) / 2), e2.scale(r2, r2), e2.globalCompositeOperation = "destination-over", e2.drawImage(t2.resource, i2.x, i2.y, i2.width, i2.height), this.config.backgroundColor && (e2.fillStyle = this.config.backgroundColor, e2.fillRect(0, 0, e2.canvas.width, e2.canvas.height)), e2.restore();
  }
  getImage() {
    let e2 = this.getCroppingRect(), t2 = this.imageState;
    if (!t2.resource) throw Error("No image resource available, please report this to: https://github.com/mosch/react-avatar-editor/issues");
    e2.x *= t2.resource.width, e2.y *= t2.resource.height, e2.width *= t2.resource.width, e2.height *= t2.resource.height;
    let n2 = document.createElement("canvas");
    this.isVertical() ? (n2.width = Math.round(e2.height), n2.height = Math.round(e2.width)) : (n2.width = Math.round(e2.width), n2.height = Math.round(e2.height));
    let r2 = n2.getContext("2d");
    if (!r2) throw Error("No context found, please report this to: https://github.com/mosch/react-avatar-editor/issues");
    return r2.translate(n2.width / 2, n2.height / 2), r2.rotate(this.config.rotate * Math.PI / 180), r2.translate(-(n2.width / 2), -(n2.height / 2)), this.isVertical() && r2.translate((n2.width - n2.height) / 2, (n2.height - n2.width) / 2), this.config.backgroundColor && (r2.fillStyle = this.config.backgroundColor, r2.fillRect(0, 0, n2.width, n2.height)), r2.drawImage(t2.resource, -e2.x, -e2.y), n2;
  }
  getImageScaledToCanvas() {
    let e2 = this.getDimensions(), t2 = this.imageState, n2 = document.createElement("canvas");
    if (this.isVertical() ? (n2.width = e2.height, n2.height = e2.width) : (n2.width = e2.width, n2.height = e2.height), !t2.resource) return n2;
    let r2 = n2.getContext("2d");
    if (!r2) return n2;
    let i2 = this.calculatePosition(t2, 0);
    return r2.save(), r2.translate(n2.width / 2, n2.height / 2), r2.rotate(this.config.rotate * Math.PI / 180), r2.translate(-(n2.width / 2), -(n2.height / 2)), this.isVertical() && r2.translate((n2.width - n2.height) / 2, (n2.height - n2.width) / 2), this.config.backgroundColor && (r2.fillStyle = this.config.backgroundColor, r2.fillRect(0, 0, n2.width, n2.height)), r2.drawImage(t2.resource, i2.x, i2.y, i2.width, i2.height), r2.restore(), n2;
  }
  calculateDragPosition(e2, t2, n2, r2) {
    let i2 = n2 - e2, a2 = r2 - t2;
    if (!this.imageState.width || !this.imageState.height) throw Error("Image dimension is unknown.");
    let o2 = this.imageState.width * this.config.scale, s2 = this.imageState.height * this.config.scale, { x: c2, y: l2 } = this.getCroppingRect();
    c2 *= o2, l2 *= s2;
    let u2 = this.config.rotate;
    u2 %= 360, u2 = u2 < 0 ? u2 + 360 : u2;
    let d2 = Math.cos(p(u2)), f2 = Math.sin(p(u2)), m2 = c2 + i2 * d2 + a2 * f2, h2 = l2 + -i2 * f2 + a2 * d2, g2 = 1 / this.config.scale * this.getXScale(), _2 = 1 / this.config.scale * this.getYScale();
    return {
      x: m2 / o2 + g2 / 2,
      y: h2 / s2 + _2 / 2
    };
  }
};
var g = () => {
};
var _ = () => {
  let e2 = false;
  try {
    let t2 = Object.defineProperty({}, "passive", { get: function() {
      e2 = true;
    } });
    window.addEventListener("test", g, t2), window.removeEventListener("test", g, t2);
  } catch {
    e2 = false;
  }
  return e2;
};
var v = (0, import_react.forwardRef)((t2, s2) => {
  let { scale: c2 = 1, rotate: l2 = 0, border: u2 = 25, borderRadius: d2 = 0, width: f2 = 200, height: p2 = 200, color: m2 = [
    0,
    0,
    0,
    0.5
  ], showGrid: g2 = false, gridColor: v2 = "#666", disableBoundaryChecks: y2 = false, disableHiDPIScaling: b = false, disableCanvasRotation: x = true, image: S, position: C, backgroundColor: w, crossOrigin: T, onLoadStart: E, onLoadFailure: D, onLoadSuccess: O, onImageReady: k, onImageChange: A, onMouseUp: j, onMouseMove: M, onPositionChange: N, borderColor: P, style: ee } = t2, F = (0, import_react.useRef)(null), I = (0, import_react.useRef)(new h({
    width: f2,
    height: p2,
    border: u2,
    borderRadius: d2,
    scale: c2,
    rotate: l2,
    color: m2,
    backgroundColor: w,
    borderColor: P,
    showGrid: g2,
    gridColor: v2,
    disableBoundaryChecks: y2,
    disableHiDPIScaling: b,
    disableCanvasRotation: x,
    crossOrigin: T
  })), L = (0, import_react.useRef)(false), R = (0, import_react.useRef)(void 0), z = (0, import_react.useRef)(void 0), [te, B] = (0, import_react.useState)(false), [V, H] = (0, import_react.useState)(false), [U, W] = (0, import_react.useState)(I.current.getImageState()), G = (0, import_react.useRef)(j);
  G.current = j;
  let K = (0, import_react.useRef)(M);
  K.current = M;
  let q = (0, import_react.useRef)(N);
  q.current = N, (0, import_react.useEffect)(() => {
    I.current.updateConfig({
      width: f2,
      height: p2,
      border: u2,
      borderRadius: d2,
      scale: c2,
      rotate: l2,
      color: m2,
      backgroundColor: w,
      borderColor: P,
      showGrid: g2,
      gridColor: v2,
      disableBoundaryChecks: y2,
      disableHiDPIScaling: b,
      disableCanvasRotation: x,
      crossOrigin: T
    });
  }, [
    f2,
    p2,
    u2,
    d2,
    c2,
    l2,
    m2,
    w,
    P,
    g2,
    v2,
    y2,
    b,
    x,
    T
  ]);
  let J = (0, import_react.useCallback)(() => {
    if (!F.current) throw Error("No canvas found, please report this to: https://github.com/mosch/react-avatar-editor/issues");
    return F.current;
  }, []), Y = (0, import_react.useCallback)(() => {
    let e2 = J().getContext("2d");
    if (!e2) throw Error("No context found, please report this to: https://github.com/mosch/react-avatar-editor/issues");
    return e2;
  }, [J]), X = (0, import_react.useCallback)(async (e2) => {
    H(true), E?.();
    try {
      let t3 = await I.current.loadImage(e2);
      L.current = false, B(false), W(t3), k?.(), O?.(t3);
    } catch {
      D?.();
    } finally {
      H(false);
    }
  }, [
    E,
    k,
    O,
    D
  ]), ne = (0, import_react.useCallback)(() => {
    let e2 = J();
    Y().clearRect(0, 0, e2.width, e2.height), I.current.clearImage(), W(I.current.getImageState());
  }, [J, Y]), Z = (0, import_react.useCallback)(() => {
    let e2 = Y(), t3 = J();
    e2.clearRect(0, 0, t3.width, t3.height), I.current.paint(e2), I.current.paintImage(e2, U, u2);
  }, [
    Y,
    J,
    U,
    u2,
    f2,
    p2,
    d2,
    c2,
    l2,
    m2,
    w,
    P,
    g2,
    v2,
    y2,
    b,
    x,
    T
  ]), re = (0, import_react.useCallback)((e2) => {
    e2.preventDefault(), L.current = true, R.current = void 0, z.current = void 0, B(true);
  }, []), ie = (0, import_react.useCallback)(() => {
    L.current = true, R.current = void 0, z.current = void 0, B(true);
  }, []);
  (0, import_react.useImperativeHandle)(s2, () => ({
    getImage: () => I.current.getImage(),
    getImageScaledToCanvas: () => I.current.getImageScaledToCanvas(),
    getCroppingRect: () => I.current.getCroppingRect()
  }), []), (0, import_react.useEffect)(() => {
    let e2 = Y();
    S && X(S), I.current.paint(e2);
    let t3 = (e3) => {
      if (!L.current) return;
      e3.cancelable && e3.preventDefault();
      let t4 = "targetTouches" in e3 ? e3.targetTouches[0].pageX : e3.clientX, n3 = "targetTouches" in e3 ? e3.targetTouches[0].pageY : e3.clientY, r3 = R.current, i2 = z.current;
      if (R.current = t4, z.current = n3, r3 !== void 0 && i2 !== void 0) {
        let e4 = I.current.getImageState();
        if (e4.width && e4.height) {
          let a2 = I.current.calculateDragPosition(t4, n3, r3, i2);
          q.current?.(a2);
          let o2 = {
            ...e4,
            ...a2
          };
          I.current.setImageState(o2), W(o2);
        }
      }
      K.current?.(e3);
    }, n2 = () => {
      L.current && (L.current = false, B(false), G.current?.());
    }, r2 = _() ? { passive: false } : false;
    return document.addEventListener("mousemove", t3, r2), document.addEventListener("mouseup", n2, r2), document.addEventListener("touchmove", t3, r2), document.addEventListener("touchend", n2, r2), () => {
      document.removeEventListener("mousemove", t3, false), document.removeEventListener("mouseup", n2, false), document.removeEventListener("touchmove", t3, false), document.removeEventListener("touchend", n2, false);
    };
  }, []), (0, import_react.useEffect)(() => {
    S ? X(S) : !S && U.x !== 0.5 && U.y !== 0.5 && ne();
  }, [
    S,
    f2,
    p2,
    w
  ]), (0, import_react.useEffect)(() => {
    Z();
  }, [Z]), (0, import_react.useEffect)(() => {
    if (!V) return;
    let e2 = F.current;
    if (!e2) return;
    let t3 = e2.getContext("2d");
    if (!t3) return;
    let n2, r2 = performance.now(), i2 = (a2) => {
      let o2 = (a2 - r2) / 1e3, s3 = 0.03 + Math.sin(o2 * 2.5) * 0.02 + 0.02;
      t3.save(), t3.clearRect(0, 0, e2.width, e2.height), t3.fillStyle = `rgba(255,255,255,${s3})`, t3.fillRect(0, 0, e2.width, e2.height), t3.restore(), n2 = requestAnimationFrame(i2);
    };
    return n2 = requestAnimationFrame(i2), () => cancelAnimationFrame(n2);
  }, [V]);
  let Q = (0, import_react.useRef)({
    image: S,
    width: f2,
    height: p2,
    position: C,
    scale: c2,
    rotate: l2,
    imageX: U.x,
    imageY: U.y
  });
  (0, import_react.useEffect)(() => {
    let e2 = Q.current;
    (e2.image !== S || e2.width !== f2 || e2.height !== p2 || e2.position !== C || e2.scale !== c2 || e2.rotate !== l2 || e2.imageX !== U.x || e2.imageY !== U.y) && (A?.(), Q.current = {
      image: S,
      width: f2,
      height: p2,
      position: C,
      scale: c2,
      rotate: l2,
      imageX: U.x,
      imageY: U.y
    });
  }, [
    S,
    f2,
    p2,
    C,
    c2,
    l2,
    U.x,
    U.y,
    A
  ]);
  let $ = I.current.getDimensions(), ae = I.current.getPixelRatio(), oe = {
    width: $.canvas.width,
    height: $.canvas.height,
    cursor: te ? "grabbing" : "grab",
    touchAction: "none",
    maxWidth: "none",
    maxHeight: "none"
  };
  return import_react.default.createElement("canvas", {
    width: $.canvas.width * ae,
    height: $.canvas.height * ae,
    onMouseDown: re,
    onTouchStart: ie,
    style: {
      ...oe,
      ...ee
    },
    ref: F
  });
});
v.displayName = "AvatarEditor";
function y() {
  let e2 = (0, import_react.useRef)(null);
  return {
    ref: e2,
    getImage: () => {
      try {
        return e2.current?.getImage() ?? null;
      } catch {
        return null;
      }
    },
    getImageScaledToCanvas: () => {
      try {
        return e2.current?.getImageScaledToCanvas() ?? null;
      } catch {
        return null;
      }
    },
    getCroppingRect: () => e2.current?.getCroppingRect() ?? null
  };
}
export {
  v as default,
  y as useAvatarEditor
};
//# sourceMappingURL=react-avatar-editor.js.map
