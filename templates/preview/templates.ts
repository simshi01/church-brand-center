const fontFaces = `
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

// ═══════════════════════════════════════════════
// SCREEN YOUTUBE — 1920 × 1080
// ═══════════════════════════════════════════════
export const screenYoutubeTemplate = `
<style>
  ${fontFaces}
  .screen, .screen * { margin: 0; padding: 0; box-sizing: border-box; }

  .screen {
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: #000;
    font-family: 'TT Hoves Pro', sans-serif;
    color: #fff;
  }

  .screen__bg {
    position: absolute;
    inset: 0;
    overflow: hidden;
    z-index: 0;
  }

  .screen__bg img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .screen__card {
    position: absolute;
    top: 39.5px;
    left: 39.5px;
    width: 800px;
    height: 1000px;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(50px);
    -webkit-backdrop-filter: blur(50px);
    border-radius: 60px;
    padding: 60px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    z-index: 2;
  }

  .screen__title {
    font-family: 'TT Hoves Pro', sans-serif;
    font-weight: 600;
    font-size: {{titleSize}}px;
    line-height: 0.9;
    letter-spacing: -0.02em;
    color: #fff;
    word-break: normal;
  }

  .screen__subtitle {
    font-family: 'TT Hoves Pro', sans-serif;
    font-weight: 500;
    font-size: 60px;
    line-height: 1;
    letter-spacing: -0.02em;
    color: #fff;
    max-width: 338px;
  }

  .screen__header {
    position: absolute;
    top: 79.5px;
    left: 919.5px;
    right: 80.5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 3;
  }

  .screen__header span {
    font-family: 'TT Hoves Pro', sans-serif;
    font-weight: 500;
    font-size: 42px;
    line-height: 1;
    letter-spacing: -0.02em;
    color: #fff;
    white-space: nowrap;
  }

  .screen__legal {
    position: absolute;
    top: 1044px;
    left: 99.5px;
    width: 700px;
    font-family: 'TT Hoves Pro', sans-serif;
    font-weight: 500;
    font-size: 12px;
    line-height: 1.25;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    text-align: justify;
    color: #fff;
    opacity: 0.3;
    z-index: 3;
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

  <div class="screen__header">
    <span>Посольство</span>
    <span>Иисуса</span>
  </div>

  <div class="screen__legal">
    Местная религиозная организация Церковь христиан веры евангельской<br>
    (пятидесятников) «Библейский центр «Посольство Иисуса» г.&nbsp;Нижний Новгород
  </div>
</div>`;

// ═══════════════════════════════════════════════
// PODCAST SQUARE — 1400 × 1400
// ═══════════════════════════════════════════════
export const podcastSquareTemplate = `
<style>
  ${fontFaces}
  .screen, .screen * { margin: 0; padding: 0; box-sizing: border-box; }

  .screen {
    position: relative;
    width: 1400px;
    height: 1400px;
    overflow: hidden;
    background: #2a1818;
    font-family: 'TT Hoves Pro', sans-serif;
    color: #fff;
  }

  .screen__bg {
    position: absolute;
    inset: -50%;
    width: 200%;
    height: 200%;
    overflow: hidden;
    z-index: 0;
    transform: scale(1.5);
  }

  .screen__bg img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: blur(120px) saturate(1.2);
  }

  .screen__overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.25);
    z-index: 1;
  }

  .screen__layout {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    padding: 80px;
    display: flex;
    flex-direction: column;
  }

  .screen__card {
    flex: 1;
    display: flex;
    align-items: flex-start;
    overflow: hidden;
  }

  .screen__title {
    font-family: 'TT Hoves Pro', sans-serif;
    font-weight: 600;
    font-size: {{titleSize}}px;
    line-height: 0.9;
    letter-spacing: -0.02em;
    color: #fff;
    word-break: normal;
    width: 100%;
  }

  .screen__speaker {
    display: flex;
    align-items: center;
    gap: 40px;
    margin-bottom: 80px;
  }

  .screen__avatar {
    width: 208px;
    height: 208px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
  }

  .screen__avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .screen__name {
    font-family: 'TT Hoves Pro', sans-serif;
    font-weight: 500;
    font-size: 78px;
    line-height: 0.9;
    letter-spacing: -0.02em;
    color: #fff;
    white-space: pre-line;
  }

  .screen__footer {
    display: flex;
    align-items: center;
    gap: 52px;
  }

  .screen__footer span {
    font-family: 'TT Hoves Pro', sans-serif;
    font-weight: 500;
    font-size: 50px;
    line-height: 1;
    letter-spacing: -0.02em;
    color: #fff;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .screen__footer-line {
    flex: 1;
    height: 2px;
    background: #fff;
    opacity: 0.9;
  }
</style>
<div class="screen">
  <div class="screen__bg">
    <img src="{{bgImage}}" alt="">
  </div>
  <div class="screen__overlay"></div>

  <div class="screen__layout">
    <div class="screen__card">
      <p class="screen__title">{{title}}</p>
    </div>

    <div class="screen__speaker">
      <div class="screen__avatar">
        <img src="{{bgImage}}" alt="">
      </div>
      <div class="screen__name">{{subtitle}}</div>
    </div>

    <footer class="screen__footer">
      <span>Посольство</span>
      <div class="screen__footer-line"></div>
      <span>Иисуса</span>
    </footer>
  </div>
</div>`;

export const templateMap: Record<string, string> = {
  'screen-youtube': screenYoutubeTemplate,
  'podcast-square': podcastSquareTemplate,
};
