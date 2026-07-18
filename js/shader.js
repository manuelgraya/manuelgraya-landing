// Fondo animado del inicio: shader WebGL adaptado de la pantalla "Shader"
// del proyecto de Stitch. Dibuja la rejilla pixel del tema (pergamino /
// madera) con puntos que pulsan y una scanline; el ratón añade un brillo
// suave. Si no hay WebGL se elimina el canvas y queda el fondo plano del
// body. Con prefers-reduced-motion se pinta un único fotograma estático.
(function () {
    var canvas = document.getElementById('fondo-shader');
    if (!canvas) return;
    var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
        canvas.parentNode.removeChild(canvas);
        return;
    }

    function ajustarTamano() {
        var w = canvas.clientWidth || 1280;
        var h = canvas.clientHeight || 720;
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }
    }
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(ajustarTamano).observe(canvas);
    }
    ajustarTamano();

    var vs = 'attribute vec2 a_position;' +
        'varying vec2 v_texCoord;' +
        'void main() {' +
        '  v_texCoord = a_position * 0.5 + 0.5;' +
        '  gl_Position = vec4(a_position, 0.0, 1.0);' +
        '}';

    var fs = [
        'precision highp float;',
        'uniform float u_time;',
        'uniform vec2 u_resolution;',
        'uniform vec2 u_mouse;',
        'varying vec2 v_texCoord;',
        'float hash(vec2 p) {',
        '    p = fract(p * vec2(123.34, 456.21));',
        '    p += dot(p, p + 45.32);',
        '    return fract(p.x * p.y);',
        '}',
        'void main() {',
        '    vec2 uv = v_texCoord;',
        '    vec2 grid_uv = uv * 40.0;',
        '    vec2 id = floor(grid_uv);',
        '    vec2 gv = fract(grid_uv) - 0.5;',
        '    float n = hash(id);',
        '    float pulse = sin(u_time * 0.5 + n * 6.28) * 0.5 + 0.5;',
        // Colores del tema: surface #fff9ec, surface-dim #e0dac8, marca #8b5e3c
        '    vec3 col = vec3(1.0, 0.976, 0.925);',
        '    vec3 gridCol = vec3(0.878, 0.855, 0.784);',
        '    vec3 signalCol = vec3(0.545, 0.369, 0.235);',
        '    float dist = length(uv - u_mouse / u_resolution);',
        '    float mousePulse = smoothstep(0.3, 0.0, dist);',
        '    float grid = smoothstep(0.48, 0.5, max(abs(gv.x), abs(gv.y)));',
        '    col = mix(col, gridCol, grid * 0.3);',
        '    if (n > 0.9) {',
        '        float dot = smoothstep(0.2, 0.1, length(gv)) * pulse;',
        '        col = mix(col, signalCol, dot * 0.4);',
        '    }',
        '    float scanline = sin(uv.y * 100.0 - u_time * 2.0) * 0.02;',
        '    col += scanline;',
        '    col = mix(col, signalCol, mousePulse * 0.05);',
        '    gl_FragColor = vec4(col, 1.0);',
        '}'
    ].join('\n');

    function compilar(tipo, src) {
        var s = gl.createShader(tipo);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, compilar(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compilar(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    var uTime = gl.getUniformLocation(prog, 'u_time');
    var uRes = gl.getUniformLocation(prog, 'u_resolution');
    var uMouse = gl.getUniformLocation(prog, 'u_mouse');

    // u_mouse en píxeles del canvas (convención ShaderToy)
    var raton = { x: canvas.width / 2, y: canvas.height / 2 };
    window.addEventListener('mousemove', function (evento) {
        var rect = canvas.getBoundingClientRect();
        if (rect.width && rect.height) {
            raton.x = (evento.clientX - rect.left) / rect.width * canvas.width;
            raton.y = (1 - (evento.clientY - rect.top) / rect.height) * canvas.height;
        }
    });

    function pintar(t) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform1f(uTime, t * 0.001);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform2f(uMouse, raton.x, raton.y);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        pintar(0);
        return;
    }

    (function bucle(t) {
        pintar(t || 0);
        requestAnimationFrame(bucle);
    })();
})();
