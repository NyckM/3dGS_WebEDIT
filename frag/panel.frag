<!-- ===== PAINEL ===== -->
<div id="panel">
  <div class="fx-tabs">
    <button class="fx-tab active" data-tab="tab-edit">✂️ Editar</button>
    <button class="fx-tab" data-tab="tab-dist">🌀 Distorção</button>
    <button class="fx-tab" data-tab="tab-cam">🎥 Câmera</button>
    <button class="fx-tab" data-tab="tab-luz">💡 Luz/Cor</button>
    <button class="fx-tab" data-tab="tab-trans">✨ Transição</button>
    <button class="fx-tab" data-tab="tab-misc">🧪 Diversos</button>
  </div>

  <!-- ========== EDITAR GAUSSIANS ========== -->
  <div class="tab-page visible" id="tab-edit">
    <h3>Tamanho do splat</h3>
    <div class="row"><label>Tamanho</label><input type="range" id="p-splatscale" min="0.05" max="3" step="0.05" value="1"><span class="val" id="v-splatscale">1.00</span></div>

    <h3>Posição dos Gaussians</h3>
    <div class="row"><label>Pos X</label><input type="range" id="p-px" min="-1" max="1" step="0.01" value="0"><span class="val" id="v-px">0.00</span></div>
    <div class="row"><label>Pos Y</label><input type="range" id="p-py" min="-1" max="1" step="0.01" value="0"><span class="val" id="v-py">0.00</span></div>
    <div class="row"><label>Pos Z</label><input type="range" id="p-pz" min="-1" max="1" step="0.01" value="0"><span class="val" id="v-pz">0.00</span></div>

    <h3>Escala / Rotação (no pivô)</h3>
    <div class="row"><label>Escala X</label><input type="range" id="p-sx" min="0.1" max="3" step="0.05" value="1"><span class="val" id="v-sx">1.00</span></div>
    <div class="row"><label>Escala Y</label><input type="range" id="p-sy" min="0.1" max="3" step="0.05" value="1"><span class="val" id="v-sy">1.00</span></div>
    <div class="row"><label>Escala Z</label><input type="range" id="p-sz" min="0.1" max="3" step="0.05" value="1"><span class="val" id="v-sz">1.00</span></div>
    <div class="row"><label>Rotação Y</label><input type="range" id="p-ry" min="-180" max="180" step="1" value="0"><span class="val" id="v-ry">0°</span></div>
    <div class="row"><label>Rotação Z</label><input type="range" id="p-twist" min="-45" max="45" step="1" value="0"><span class="val" id="v-twist">0°</span></div>
    <button class="panel-btn" id="p-reset-transform">Resetar transformações</button>

    <h3>Anchor Point (pivô)</h3>
    <div class="row"><label>Pivô X</label><input type="range" id="a-x" min="0" max="1" step="0.01" value="0.5"><span class="val" id="v-ax">50%</span></div>
    <div class="row"><label>Pivô Y</label><input type="range" id="a-y" min="0" max="1" step="0.01" value="0.5"><span class="val" id="v-ay">50%</span></div>
    <div class="row"><label>Pivô Z</label><input type="range" id="a-z" min="0" max="1" step="0.01" value="0.5"><span class="val" id="v-az2">50%</span></div>
    <button class="panel-btn" id="ac-toggle">▶ Crop radial no pivô</button>
    <div class="row"><label>Raio</label><input type="range" id="a-r" min="0.05" max="1" step="0.01" value="0.5"><span class="val" id="v-ar">50%</span></div>
    <p class="note">O pivô é o centro de escala/rotação, das distorções, das transições e da luz pontual.</p>

    <h3>Crop (box 3D)</h3>
    <button class="panel-btn" id="cb-toggle">▶ Crop box (ao vivo)</button>
    <div class="row"><label>Pos X</label><input type="range" id="cb-px" min="0" max="1" step="0.01" value="0.5"><span class="val" id="v-cbpx">50%</span></div>
    <div class="row"><label>Pos Y</label><input type="range" id="cb-py" min="0" max="1" step="0.01" value="0.5"><span class="val" id="v-cbpy">50%</span></div>
    <div class="row"><label>Pos Z</label><input type="range" id="cb-pz" min="0" max="1" step="0.01" value="0.5"><span class="val" id="v-cbpz">50%</span></div>
    <div class="row"><label>Escala X</label><input type="range" id="cb-sx" min="0.02" max="1.2" step="0.01" value="1"><span class="val" id="v-cbsx">1.00</span></div>
    <div class="row"><label>Escala Y</label><input type="range" id="cb-sy" min="0.02" max="1.2" step="0.01" value="1"><span class="val" id="v-cbsy">1.00</span></div>
    <div class="row"><label>Escala Z</label><input type="range" id="cb-sz" min="0.02" max="1.2" step="0.01" value="1"><span class="val" id="v-cbsz">1.00</span></div>
    <div class="row"><label>Rot X</label><input type="range" id="cb-rx" min="-180" max="180" step="1" value="0"><span class="val" id="v-cbrx">0°</span></div>
    <div class="row"><label>Rot Y</label><input type="range" id="cb-ry" min="-180" max="180" step="1" value="0"><span class="val" id="v-cbry">0°</span></div>
    <div class="row"><label>Rot Z</label><input type="range" id="cb-rz" min="-180" max="180" step="1" value="0"><span class="val" id="v-cbrz">0°</span></div>
    <div class="btn-pair">
      <button class="panel-btn" id="c-apply">Aplicar (permanente)</button>
      <button class="panel-btn" id="c-reset">Resetar</button>
    </div>
    <p class="note" id="crop-note">O box verde mostra a área mantida. O crop ao vivo (GPU) funciona em qualquer formato; o permanente só em <b>.splat</b> e <b>.ply</b> binário de cena única.</p>
  </div>

  <!-- ========== EFEITOS DE DISTORÇÃO ========== -->
  <div class="tab-page" id="tab-dist">
    <p class="note">Todos animados, centrados no <b>Anchor Point</b>. "Raio" limita a uma esfera no pivô; o box (posição/escala/rotação) limita a uma caixa — o box roxo aparece com 👁.</p>
    <div id="dist-container"></div>
  </div>

  <!-- ========== EFEITOS DE CÂMERA ========== -->
  <div class="tab-page" id="tab-cam">
    <h3>Lente</h3>
    <div class="row"><label>FOV</label><input type="range" id="cam-fov" min="15" max="120" step="1" value="60"><span class="val" id="v-fov">60°</span></div>
    <p class="note" id="v-mm">Equivalente a ~21mm (full frame)</p>

    <h3>Órbita X / Y / Z</h3>
    <button class="panel-btn" id="co-toggle">▶ Órbita</button>
    <div class="row"><label>Vel X</label><input type="range" id="co-sx" min="-10" max="10" step="0.5" value="0"><span class="val" id="v-cosx">0.0</span></div>
    <div class="row"><label>Vel Y</label><input type="range" id="a-orbitspeed" min="-10" max="10" step="0.5" value="2"><span class="val" id="v-orbitspeed">2.0</span></div>
    <div class="row"><label>Vel Z</label><input type="range" id="co-sz" min="-10" max="10" step="0.5" value="0"><span class="val" id="v-cosz">0.0</span></div>

    <h3>Vertigo (dolly zoom)</h3>
    <button class="panel-btn" id="vt-toggle">▶ Vertigo</button>
    <div class="row"><label>Velocidade</label><input type="range" id="vt-speed" min="-5" max="5" step="0.1" value="1"><span class="val" id="v-vtspeed">1.0</span></div>
    <p class="note">A câmera avança/recua mirando o <b>Anchor Point</b> enquanto o FOV compensa (efeito Hitchcock).</p>

    <h3>Dolly</h3>
    <button class="panel-btn" id="dl-toggle">▶ Dolly In/Out</button>
    <div class="row"><label>Velocidade</label><input type="range" id="dl-speed" min="-5" max="5" step="0.1" value="1"><span class="val" id="v-dlspeed">1.0</span></div>
    <button class="panel-btn" id="tk-toggle">▶ Dolly Left/Right</button>
    <div class="row"><label>Velocidade</label><input type="range" id="tk-speed" min="-5" max="5" step="0.1" value="1"><span class="val" id="v-tkspeed">1.0</span></div>

    <h3>Tilt</h3>
    <button class="panel-btn" id="tl-toggle">▶ Tilt Up/Down</button>
    <div class="row"><label>Velocidade</label><input type="range" id="tl-speed" min="-5" max="5" step="0.1" value="1"><span class="val" id="v-tlspeed">1.0</span></div>

    <h3>Handheld (shake)</h3>
    <button class="panel-btn" id="hh-toggle">▶ Camera shake</button>
    <div class="row"><label>Intensidade</label><input type="range" id="hh-amp" min="0" max="3" step="0.05" value="0.6"><span class="val" id="v-hhamp">0.60</span></div>
    <div class="row"><label>Frequência</label><input type="range" id="hh-freq" min="0.2" max="8" step="0.1" value="2"><span class="val" id="v-hhfreq">2.0</span></div>
  </div>

  <!-- ========== ILUMINAÇÃO / COR ========== -->
  <div class="tab-page" id="tab-luz">
    <h3>Correção de cor / LUT</h3>
    <button class="panel-btn" id="cg-toggle">▶ Grading</button>
    <div class="row"><label>Exposição</label><input type="range" id="cg-exp" min="0.2" max="2.5" step="0.02" value="1"><span class="val" id="v-cgexp">1.00</span></div>
    <div class="row"><label>Contraste</label><input type="range" id="cg-con" min="0.5" max="2" step="0.02" value="1"><span class="val" id="v-cgcon">1.00</span></div>
    <div class="row"><label>Saturação</label><input type="range" id="cg-sat" min="0" max="2" step="0.02" value="1"><span class="val" id="v-cgsat">1.00</span></div>
    <div class="row"><label>Temperatura</label><input type="range" id="cg-temp" min="-0.5" max="0.5" step="0.01" value="0"><span class="val" id="v-cgtemp">0.00</span></div>
    <div class="row"><label>Tint</label><input type="range" id="cg-tint" min="-0.5" max="0.5" step="0.01" value="0"><span class="val" id="v-cgtint">0.00</span></div>
    <div class="btn-pair">
      <button class="panel-btn" id="cg-cine">🎬 Cine</button>
      <button class="panel-btn" id="cg-reset">Resetar</button>
    </div>

    <h3>Luz pontual (point light)</h3>
    <button class="panel-btn" id="pl-toggle">▶ Luz pontual</button>
    <div class="row"><label>Pos X</label><input type="range" id="pl-x" min="-0.5" max="1.5" step="0.01" value="0.5"><span class="val" id="v-plx">50%</span></div>
    <div class="row"><label>Pos Y</label><input type="range" id="pl-y" min="-0.5" max="1.5" step="0.01" value="0.1"><span class="val" id="v-ply">10%</span></div>
    <div class="row"><label>Pos Z</label><input type="range" id="pl-z" min="-0.5" max="1.5" step="0.01" value="0.5"><span class="val" id="v-plz">50%</span></div>
    <div class="row"><label>Intensidade</label><input type="range" id="pl-str" min="0" max="5" step="0.05" value="1.5"><span class="val" id="v-plstr">1.50</span></div>
    <div class="row"><label>Alcance</label><input type="range" id="pl-radius" min="0.1" max="2" step="0.02" value="1"><span class="val" id="v-plradius">1.00</span></div>
    <div class="row"><label>Cor</label><input type="color" id="pl-color" value="#ffd9a0" style="flex:1; height:26px; background:none; border:none; cursor:pointer;"></div>
    <p class="note">Posição mapeada no volume da cena. A dureza da sombra usa o slider "Sombra" do Relight.</p>

    <h3>Relight (2 luzes + sombra)</h3>
    <button class="panel-btn" id="l-toggle">▶ Relight</button>
    <div class="row"><label>Sombra</label><input type="range" id="l-shadow" min="0.3" max="5" step="0.1" value="1"><span class="val" id="v-lshadow">1.0</span></div>
    <div class="row"><label>Ambiente</label><input type="range" id="l-amb" min="0" max="1" step="0.05" value="0.35"><span class="val" id="v-lamb">0.35</span></div>
    <p class="note"><b>Luz 1</b></p>
    <div class="row"><label>Azimute</label><input type="range" id="l-az" min="-180" max="180" step="1" value="45"><span class="val" id="v-laz">45°</span></div>
    <div class="row"><label>Altura</label><input type="range" id="l-el" min="-90" max="90" step="1" value="30"><span class="val" id="v-lel">30°</span></div>
    <div class="row"><label>Intensidade</label><input type="range" id="l-str" min="0" max="3" step="0.05" value="1.2"><span class="val" id="v-lstr">1.20</span></div>
    <div class="row"><label>Cor</label><input type="color" id="l-color" value="#ffffff" style="flex:1; height:26px; background:none; border:none; cursor:pointer;"></div>
    <button class="panel-btn" id="l2-toggle">+ Luz 2 (desligada)</button>
    <div class="row"><label>Azimute 2</label><input type="range" id="l2-az" min="-180" max="180" step="1" value="-120"><span class="val" id="v-l2az">-120°</span></div>
    <div class="row"><label>Altura 2</label><input type="range" id="l2-el" min="-90" max="90" step="1" value="10"><span class="val" id="v-l2el">10°</span></div>
    <div class="row"><label>Intens. 2</label><input type="range" id="l2-str" min="0" max="3" step="0.05" value="0.8"><span class="val" id="v-l2str">0.80</span></div>
    <div class="row"><label>Cor 2</label><input type="color" id="l2-color" value="#aaccff" style="flex:1; height:26px; background:none; border:none; cursor:pointer;"></div>
    <p class="note">Relight aproximado (sem normais reais — usa direção radial).</p>

    <h3>Desfoque de fundo (DoF)</h3>
    <button class="panel-btn" id="d-toggle">▶ Desfoque</button>
    <div class="row"><label>Foco (dist.)</label><input type="range" id="d-dist" min="0.1" max="20" step="0.1" value="3"><span class="val" id="v-ddist">3.0</span></div>
    <div class="row"><label>Faixa nítida</label><input type="range" id="d-range" min="0.1" max="10" step="0.1" value="1.5"><span class="val" id="v-drange">1.5</span></div>
    <div class="row"><label>Intensidade</label><input type="range" id="d-blur" min="0.5" max="12" step="0.5" value="6"><span class="val" id="v-dblur">6.0</span></div>
  </div>

  <!-- ========== EFEITOS DE TRANSIÇÃO ========== -->
  <div class="tab-page" id="tab-trans">
    <p class="note">Todas as transições partem do <b>Anchor Point</b> (aba Editar).</p>

    <h3>Dissolve (difusão)</h3>
    <div class="btn-pair">
      <button class="panel-btn" id="dis-out">▶ Dissolver</button>
      <button class="panel-btn" id="dis-in">◀ Voltar</button>
    </div>
    <div class="row"><label>Duração</label><input type="range" id="dis-dur" min="0.5" max="10" step="0.5" value="3"><span class="val" id="v-disdur">3.0s</span></div>
    <p class="note">O raio cresce a partir do pivô e os splats vão se difundindo e sumindo.</p>

    <h3>Reveal</h3>
    <div class="btn-pair">
      <button class="panel-btn" id="r-play">▶ Revelar</button>
      <button class="panel-btn" id="r-hide">◀ Esconder</button>
    </div>
    <div class="row"><label>Duração</label><input type="range" id="r-dur" min="0.5" max="10" step="0.5" value="3"><span class="val" id="v-rdur">3.0s</span></div>
    <p class="note">O raio cresce a partir do pivô e a cena vai aparecendo.</p>

    <h3>Fumaça (difusão global)</h3>
    <div class="btn-pair">
      <button class="panel-btn" id="s-out">▶ Dissipar</button>
      <button class="panel-btn" id="s-in">◀ Reverter</button>
    </div>
    <div class="row"><label>Distância</label><input type="range" id="s-dist" min="0.5" max="10" step="0.1" value="3"><span class="val" id="v-sdist">3.0</span></div>
    <div class="row"><label>Duração</label><input type="range" id="s-dur" min="0.5" max="10" step="0.5" value="3"><span class="val" id="v-sdur">3.0s</span></div>

    <h3>Dissolve (escala)</h3>
    <div class="btn-pair">
      <button class="panel-btn" id="fx-dissolve-out">Dissolve ✕</button>
      <button class="panel-btn" id="fx-dissolve-in">Dissolve ✓</button>
    </div>
    <div class="row"><label>Duração</label><input type="range" id="fx-dur" min="0.5" max="8" step="0.5" value="2"><span class="val" id="v-fxdur">2.0s</span></div>
  </div>

  <!-- ========== EFEITOS DIVERSOS ========== -->
  <div class="tab-page" id="tab-misc">
    <h3>Weather (clima)</h3>
    <button class="panel-btn" id="fog-toggle">▶ Névoa</button>
    <div class="row"><label>Cor</label><input type="color" id="fog-color" value="#b3bfd9" style="flex:1; height:26px; background:none; border:none; cursor:pointer;"></div>
    <div class="row"><label>Início</label><input type="range" id="fog-near" min="0" max="15" step="0.1" value="2"><span class="val" id="v-fognear">2.0</span></div>
    <div class="row"><label>Fim</label><input type="range" id="fog-far" min="1" max="30" step="0.5" value="12"><span class="val" id="v-fogfar">12</span></div>
    <div class="btn-pair">
      <button class="panel-btn" id="wx-snow">❄ Neve</button>
      <button class="panel-btn" id="wx-rain">🌧 Chuva</button>
    </div>
    <div class="row"><label>Quantidade</label><input type="range" id="wx-amt" min="500" max="12000" step="500" value="4000"><span class="val" id="v-wxamt">4k</span></div>
    <div class="row"><label>Tamanho</label><input type="range" id="wx-size" min="0.2" max="4" step="0.1" value="1"><span class="val" id="v-wxsize">1.0</span></div>

    <h3>Pontos P&B</h3>
    <button class="panel-btn" id="pb-toggle">▶ Modo pontos P&B</button>
    <p class="note">Nuvem de pontos em preto e branco. Use "Tamanho do splat" para o tamanho dos pontos.</p>

    <h3>Pontos por profundidade</h3>
    <button class="panel-btn" id="dc-toggle">▶ Perto/Longe</button>
    <div class="row"><label>Cor perto</label><input type="color" id="dc-cnear" value="#96c93d" style="flex:1; height:26px; background:none; border:none; cursor:pointer;"></div>
    <div class="row"><label>Cor longe</label><input type="color" id="dc-cfar" value="#7b2d8e" style="flex:1; height:26px; background:none; border:none; cursor:pointer;"></div>
    <div class="row"><label>Início</label><input type="range" id="dc-n" min="0" max="15" step="0.1" value="1"><span class="val" id="v-dcn">1.0</span></div>
    <div class="row"><label>Fim</label><input type="range" id="dc-f" min="0.5" max="30" step="0.5" value="8"><span class="val" id="v-dcf">8.0</span></div>
    <p class="note">O que está perto da câmera fica verde e o que está longe fica roxo (cores ajustáveis).</p>

    <h3>Paint (pincel)</h3>
    <button class="panel-btn" id="pt-toggle">🖌 Modo pincel</button>
    <div class="row"><label>Cor</label><input type="color" id="pt-color" value="#9933b3" style="flex:1; height:26px; background:none; border:none; cursor:pointer;"></div>
    <div class="row"><label>Tamanho</label><input type="range" id="pt-r" min="0.05" max="1" step="0.01" value="0.25"><span class="val" id="v-ptr">25%</span></div>
    <div class="row"><label>Força</label><input type="range" id="pt-str" min="0" max="1" step="0.05" value="0.8"><span class="val" id="v-ptstr">0.80</span></div>
    <button class="panel-btn" id="pt-clear">Limpar pinceladas</button>
    <p class="note">Com o modo pincel ligado, clique e arraste sobre a cena para pintar (a órbita do mouse fica pausada). Até 64 pinceladas.</p>

    <h3>Time Slice (4D)</h3>
    <button class="panel-btn" id="ts-toggle">▶ Time Slice</button>
    <div class="row"><label>Eixo</label><input type="range" id="ts-axis" min="0" max="2" step="1" value="0"><span class="val" id="v-tsaxis">X</span></div>
    <div class="row"><label>Deslocar</label><input type="range" id="ts-shift" min="0" max="1" step="0.01" value="0"><span class="val" id="v-tsshift">0%</span></div>
    <button class="panel-btn" id="ts-invert">Inverter direção</button>
    <p class="note">Só em sequências 4D: cada fatia do espaço mostra um frame do tempo (slit-scan).</p>
  </div>

  <h3>Gravação</h3>
  <div class="row"><label>Duração</label><input type="range" id="rec-dur" min="2" max="30" step="1" value="8"><span class="val" id="v-recdur">8s</span></div>
  <div class="row"><label>Bitrate</label><input type="range" id="rec-bps" min="10" max="120" step="5" value="50"><span class="val" id="v-recbps">50M</span></div>
  <button class="panel-btn" id="rec-orbit">⏺ Gravar órbita (MP4)</button>
  <p class="note">Grava o canvas. Chrome/Edge salvam MP4; outros navegadores salvam WebM.</p>
</div>

