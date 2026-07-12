<p align="center"><img src="Bruxos.png" width="160" alt="Bruxos do VFX"></p>

# Bruxos do VFX · 3DGS

Viewer e editor de **3D Gaussian Splatting** no navegador + pipeline gratuito para transformar vídeos em splats.

## 🔮 O que tem aqui

| Arquivo | O que é |
|---|---|
| `index.html` | Viewer/editor 3DGS completo (roda no GitHub Pages) |
| `Bruxos_VFX_3DGS.ipynb` | Notebook Colab: vídeo → Gaussian Splatting grátis |
| `Bruxos_VFX_SHARP.ipynb` | Notebook Colab: **uma foto** → Gaussian Splatting em <1s ([Apple SHARP](https://github.com/apple/ml-sharp)) |
| `Bruxos_VFX_4DGS.ipynb` | Notebook Colab: **vídeo → sequência 4DGS** (um .ply por frame, play no viewer) |
| `Bruxos.png` | Logo |

## ✨ Recursos do viewer

- Importar `.ply`, `.splat` e `.ksplat` (botão ou arrastar e soltar)
- Distorcer/esticar (escala X/Y/Z, rotação, twist)
- Crop por caixa (`.splat` e `.ply` binário)
- Animação de câmera (órbita/turntable com velocidade ajustável)
- Efeitos na GPU: **Waves** (distorção ondulante), **Fumaça** (difusão do centro para fora), **Relight** (luz direcional aproximada com cor), **Dissolve** e **Wobble**
- Gravação de vídeo do canvas (MP4 no Chrome/Edge, WebM nos demais)
- Carregar cena por URL: `index.html?url=https://.../cena.splat`
o site estará em `https://nyckm.github.io/3dGS_WebEDIT/`

O viewer tem o botão **"🎬 Não tem um splat? Crie a partir de um vídeo"** na tela inicial. Para ativá-lo:

3. No notebook (`Bruxos_VFX_3DGS.ipynb`), edite a última célula com o link do seu viewer

Pronto: quem clicar no botão abre o Colab, roda o pipeline na GPU gratuita do Google e baixa o `.ply` para abrir no viewer.

## 🎥 Como criar um splat a partir de vídeo

1. Grave 30s-2min orbitando o objeto/cena devagar (boa luz, sem borrão)
2. Abra o notebook no Colab (botão do viewer ou badge abaixo)
3. Ative a GPU (`Ambiente de execução → Alterar tipo → GPU T4`)
4. Rode as células na ordem, envie o vídeo e baixe o `.ply`

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/nyckm/3dGS_WebEDIT/blob/main/Bruxos_VFX_3DGS.ipynb)

## ⚙️ Créditos

Renderização: [GaussianSplats3D](https://github.com/mkkellogg/GaussianSplats3D) (mkkellogg) · [Three.js](https://threejs.org) · Treino: [Nerfstudio / splatfacto](https://docs.nerf.studio)

---

<p align="center">Feito com 💜 por <b>Bruxos do VFX</b></p>
