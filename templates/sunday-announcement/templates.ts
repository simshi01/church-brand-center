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
// POST SUNDAY — 1200 × 1500
// ═══════════════════════════════════════════════
export const postSundayTemplate = `
<style>
  ${fontFaces}
  .screen, .screen * { margin: 0; padding: 0; box-sizing: border-box; }

  .screen {
    position: relative;
    width: 1200px;
    height: 1500px;
    overflow: hidden;
    background: #fff;
    font-family: 'TT Hoves Pro', sans-serif;
    color: #000;
  }

  .screen__photo-wrap {
    position: absolute;
    inset: 0;
    z-index: 1;
    clip-path: polygon(
      0%   9.93%,
      25%  9.93%,
      25%  13.87%,
      75%  13.87%,
      75%  18.8%,
      100% 18.8%,
      100% 95%,
      0%   95%
    );
  }

  .screen__photo-bg,
  .screen__photo-cutout {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
  }

  .screen__photo-bg {
    z-index: 1;
    transition: filter 0.2s ease;
  }

  .screen__photo-cutout {
    z-index: 2;
  }

  .screen[data-cutout-active="true"] .screen__photo-bg {
    filter: grayscale(1);
  }

  .screen[data-cutout-active="false"] .screen__photo-cutout {
    display: none;
  }

  .screen__header-word {
    position: absolute;
    top: 40px;
    font-family: 'TT Hoves Pro', sans-serif;
    font-weight: 600;
    font-size: 30px;
    line-height: 1;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: #000;
    white-space: nowrap;
    z-index: 3;
  }

  .screen__header-word--left { left: 40px; }
  .screen__header-word--center { left: 50%; transform: translateX(-50%); }
  .screen__header-word--right { right: 40px; }

  .screen__info {
    position: absolute;
    left: 40px;
    right: 40px;
    bottom: 120px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    z-index: 3;
  }

  .screen__info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 30px 40px;
    height: 97px;
    font-family: 'TT Hoves Pro', sans-serif;
    font-weight: 500;
    font-size: 40px;
    line-height: 1;
    letter-spacing: -0.01em;
    white-space: nowrap;
  }

  .screen__info-row--light {
    background: #fff;
    color: #000;
  }

  .screen__info-row--dark {
    background: #000;
    color: #fff;
  }

  .screen__info-online {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .screen__info-row:not([data-online="true"]) .screen__info-online {
    display: none;
  }

  .screen[data-service-count="1"] .screen__info-row--service-2 {
    display: none;
  }

  .screen__info-dot {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #ff6b1a;
    flex-shrink: 0;
  }

  .screen__legal {
    position: absolute;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%);
    width: 720px;
    font-family: 'TT Hoves Pro', sans-serif;
    font-weight: 500;
    font-size: 12px;
    line-height: 1.3;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    text-align: center;
    color: #000;
    opacity: 0.3;
    z-index: 3;
  }
</style>
<div class="screen" data-cutout-active="{{cutoutActive}}" data-service-count="{{serviceCount}}">
  <div class="screen__photo-wrap">
    <img class="screen__photo-bg" src="{{bgImage}}" alt="">
    <img class="screen__photo-cutout" src="{{bgImageCutout}}" alt="">
  </div>

  <span class="screen__header-word screen__header-word--left">Церковь</span>
  <span class="screen__header-word screen__header-word--center">Посольство</span>
  <span class="screen__header-word screen__header-word--right">Иисуса</span>

  <div class="screen__info">
    <div class="screen__info-row screen__info-row--light">
      <span>Проповедует</span>
      <span>{{speaker}}</span>
    </div>
    <div class="screen__info-row screen__info-row--dark screen__info-row--service-1" data-online="{{service1Online}}">
      <span>{{service1Time}}</span>
      <span class="screen__info-online">
        <span class="screen__info-dot"></span>
        <span>Онлайн-трансляция</span>
      </span>
      <span>{{service1Address}}</span>
    </div>
    <div class="screen__info-row screen__info-row--dark screen__info-row--service-2" data-online="{{service2Online}}">
      <span>{{service2Time}}</span>
      <span class="screen__info-online">
        <span class="screen__info-dot"></span>
        <span>Онлайн-трансляция</span>
      </span>
      <span>{{service2Address}}</span>
    </div>
  </div>

  <div class="screen__legal">
    Местная религиозная организация Церковь христиан веры евангельской (пятидесятников) «Библейский центр „Посольство Иисуса"» г.&nbsp;Нижний Новгород
  </div>
</div>`;

export const templateMap: Record<string, string> = {
  'post-sunday': postSundayTemplate,
};
