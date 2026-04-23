const fontFaces = `
  @font-face {
    font-family: 'TT Hoves Pro Expanded';
    font-weight: 600;
    font-style: normal;
    src: url('/fonts/TT_Hoves_Pro_Expanded_DemiBold.otf') format('opentype');
  }
  @font-face {
    font-family: 'TT Hoves Pro';
    font-weight: 500;
    font-style: normal;
    src: url('/fonts/TT_Hoves_Pro_Medium.otf') format('opentype');
  }
  @font-face {
    font-family: 'TT Hoves Pro';
    font-weight: 600;
    font-style: normal;
    src: url('/fonts/TT_Hoves_Pro_DemiBold.otf') format('opentype');
  }
`;

// ── Text fit config per variant ──
export const textFitConfig: Record<string, { maxFontSize: number; minFontSize: number }> = {
  screen:       { maxFontSize: 200, minFontSize: 80 },
  'screen-16-9': { maxFontSize: 200, minFontSize: 80 },
  'screen-4-3':  { maxFontSize: 200, minFontSize: 80 },
  post:         { maxFontSize: 120, minFontSize: 44 },
  story:        { maxFontSize: 120, minFontSize: 50 },
  'print-a4':   { maxFontSize: 180, minFontSize: 60 },
};

// ═══════════════════════════════════════════════
// SCREEN — 2970 × 1080
// ═══════════════════════════════════════════════
export const screenTemplate = `
<style>
  ${fontFaces}
  .screen, .screen * { margin: 0; padding: 0; box-sizing: border-box; }

  .screen {
    position: relative;
    width: 2970px;
    height: 1080px;
    overflow: hidden;
    background: #151515;
  }

  .screen__bg {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .screen__bg img {
    position: absolute;
    top: -46.39%;
    left: 0;
    width: 100%;
    height: 192.78%;
    object-fit: cover;
  }

  .screen__card {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 1169px;
    height: 900px;
    background: {{cardColor}};
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 80px;
    overflow: hidden;
  }

  .screen__title {
    font-family: 'TT Hoves Pro Expanded', sans-serif;
    font-weight: 600;
    font-size: {{titleSize}}px;
    line-height: 0.8;
    letter-spacing: -4px;
    color: {{textColor}};
    word-break: normal;
    padding-bottom: 0.1em;
  }

  .screen__subtitle {
    font-family: 'TT Hoves Pro', sans-serif;
    font-weight: 500;
    font-size: 60px;
    line-height: 0.9;
    color: {{textColor}};
  }
</style>
<div class="screen">
  <div class="screen__bg">
    <img src="{{bgImage}}" alt="">
  </div>
  <div class="screen__card">
    <p class="screen__title">{{title}}</p>
    <p class="screen__subtitle">{{subtitle}}</p>
  </div>
</div>`;

// ═══════════════════════════════════════════════
// SCREEN 16:9 — 1920 × 1080
// ═══════════════════════════════════════════════
export const screen16_9Template = `
<style>
  ${fontFaces}
  .screen, .screen * { margin: 0; padding: 0; box-sizing: border-box; }

  .screen {
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: #151515;
  }

  .screen__bg {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .screen__bg img {
    position: absolute;
    top: -46.39%;
    left: 0;
    width: 100%;
    height: 192.78%;
    object-fit: cover;
  }

  .screen__card {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(calc(-50% + 0.5px), -50%);
    width: 1169px;
    height: 900px;
    background: {{cardColor}};
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 80px;
    overflow: hidden;
  }

  .screen__title {
    font-family: 'TT Hoves Pro Expanded', sans-serif;
    font-weight: 600;
    font-size: {{titleSize}}px;
    line-height: 0.8;
    letter-spacing: -4px;
    color: {{textColor}};
    word-break: normal;
    padding-bottom: 0.1em;
  }

  .screen__subtitle {
    font-family: 'TT Hoves Pro', sans-serif;
    font-weight: 500;
    font-size: 60px;
    line-height: 0.9;
    color: {{textColor}};
  }
</style>
<div class="screen">
  <div class="screen__bg">
    <img src="{{bgImage}}" alt="">
  </div>
  <div class="screen__card">
    <p class="screen__title">{{title}}</p>
    <p class="screen__subtitle">{{subtitle}}</p>
  </div>
</div>`;

// ═══════════════════════════════════════════════
// SCREEN 4:3 — 1440 × 1080
// ═══════════════════════════════════════════════
export const screen4_3Template = `
<style>
  ${fontFaces}
  .screen, .screen * { margin: 0; padding: 0; box-sizing: border-box; }

  .screen {
    position: relative;
    width: 1440px;
    height: 1080px;
    overflow: hidden;
    background: #151515;
  }

  .screen__bg {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .screen__bg img {
    position: absolute;
    top: -46.39%;
    left: 0;
    width: 100%;
    height: 192.78%;
    object-fit: cover;
  }

  .screen__card {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(calc(-50% + 0.5px), -50%);
    width: 1169px;
    height: 900px;
    background: {{cardColor}};
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 80px;
    overflow: hidden;
  }

  .screen__title {
    font-family: 'TT Hoves Pro Expanded', sans-serif;
    font-weight: 600;
    font-size: {{titleSize}}px;
    line-height: 0.8;
    letter-spacing: -4px;
    color: {{textColor}};
    word-break: normal;
    padding-bottom: 0.1em;
  }

  .screen__subtitle {
    font-family: 'TT Hoves Pro', sans-serif;
    font-weight: 500;
    font-size: 60px;
    line-height: 0.9;
    color: {{textColor}};
  }
</style>
<div class="screen">
  <div class="screen__bg">
    <img src="{{bgImage}}" alt="">
  </div>
  <div class="screen__card">
    <p class="screen__title">{{title}}</p>
    <p class="screen__subtitle">{{subtitle}}</p>
  </div>
</div>`;

// ═══════════════════════════════════════════════
// POST — 1200 × 1600
// ═══════════════════════════════════════════════
export const postTemplate = `
<style>
  ${fontFaces}
  .screen, .screen * { margin: 0; padding: 0; box-sizing: border-box; }

  .screen {
    position: relative;
    width: 1200px;
    height: 1600px;
    overflow: hidden;
    background: #151515;
  }

  .screen__bg {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .screen__bg img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .screen__card {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 1000px;
    height: 1000px;
    background: {{cardColor}};
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 70px;
    overflow: hidden;
  }

  .screen__title {
    font-family: 'TT Hoves Pro Expanded', sans-serif;
    font-weight: 600;
    font-size: {{titleSize}}px;
    line-height: 0.9;
    letter-spacing: -3px;
    color: {{textColor}};
    word-break: normal;
    padding-bottom: 0.1em;
  }

  .screen__subtitle {
    font-family: 'TT Hoves Pro', sans-serif;
    font-weight: 500;
    font-size: 36px;
    line-height: 1.1;
    color: {{textColor}};
  }
</style>
<div class="screen">
  <div class="screen__bg">
    <img src="{{bgImage}}" alt="">
  </div>
  <div class="screen__card">
    <p class="screen__title">{{title}}</p>
    <p class="screen__subtitle">{{subtitle}}</p>
  </div>
</div>`;

// ═══════════════════════════════════════════════
// STORY — 1080 × 1920
// ═══════════════════════════════════════════════
export const storyTemplate = `
<style>
  ${fontFaces}
  .screen, .screen * { margin: 0; padding: 0; box-sizing: border-box; }

  .screen {
    position: relative;
    width: 1080px;
    height: 1920px;
    overflow: hidden;
    background: #151515;
  }

  .screen__bg {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .screen__bg img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .screen__card {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 920px;
    height: 1400px;
    background: {{cardColor}};
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 80px;
    overflow: hidden;
  }

  .screen__title {
    font-family: 'TT Hoves Pro Expanded', sans-serif;
    font-weight: 600;
    font-size: {{titleSize}}px;
    line-height: 0.9;
    letter-spacing: -4px;
    color: {{textColor}};
    word-break: normal;
    padding-bottom: 0.1em;
  }

  .screen__subtitle {
    font-family: 'TT Hoves Pro', sans-serif;
    font-weight: 500;
    font-size: 40px;
    line-height: 1.1;
    color: {{textColor}};
  }
</style>
<div class="screen">
  <div class="screen__bg">
    <img src="{{bgImage}}" alt="">
  </div>
  <div class="screen__card">
    <p class="screen__title">{{title}}</p>
    <p class="screen__subtitle">{{subtitle}}</p>
  </div>
</div>`;

// ═══════════════════════════════════════════════
// PRINT A4 — 2480 × 3508
// ═══════════════════════════════════════════════
export const printA4Template = `
<style>
  ${fontFaces}
  .screen, .screen * { margin: 0; padding: 0; box-sizing: border-box; }

  .screen {
    position: relative;
    width: 2480px;
    height: 3508px;
    overflow: hidden;
    background: #151515;
  }

  .screen__bg {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .screen__bg img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .screen__card {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 2100px;
    height: 2900px;
    background: {{cardColor}};
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 160px;
    overflow: hidden;
  }

  .screen__title {
    font-family: 'TT Hoves Pro Expanded', sans-serif;
    font-weight: 600;
    font-size: {{titleSize}}px;
    line-height: 0.9;
    letter-spacing: -6px;
    color: {{textColor}};
    word-break: normal;
    padding-bottom: 0.1em;
  }

  .screen__subtitle {
    font-family: 'TT Hoves Pro', sans-serif;
    font-weight: 500;
    font-size: 50px;
    line-height: 1.1;
    color: {{textColor}};
  }
</style>
<div class="screen">
  <div class="screen__bg">
    <img src="{{bgImage}}" alt="">
  </div>
  <div class="screen__card">
    <p class="screen__title">{{title}}</p>
    <p class="screen__subtitle">{{subtitle}}</p>
  </div>
</div>`;

export const templateMap: Record<string, string> = {
  screen: screenTemplate,
  'screen-16-9': screen16_9Template,
  'screen-4-3': screen4_3Template,
  post: postTemplate,
  story: storyTemplate,
  'print-a4': printA4Template,
};
