import React, { useEffect, useRef, useContext, useState } from 'react';
import { loadModules } from 'esri-loader';
import { generateCones } from '../../helpers/helpers';
import { store } from '../../store/store';

export const SceneView = () => {
  const globalState = useContext(store);

  const sceneRef = useRef();
  const [sceneView, setView] = useState(null);
  let [graphicsLayer, setGraphicsLayer] = useState(null);

  const now = globalState.state.date;

  useEffect(() => {
    // lazy load the required ArcGIS API for JavaScript modules and CSS
    async function loadWebScene() {
      const [Map, SceneView, GraphicsLayer, Expand, BasemapGallery] =
        await loadModules(
          [
            'esri/Map',
            'esri/views/SceneView',
            'esri/layers/GraphicsLayer',
            'esri/widgets/Expand',
            'esri/widgets/BasemapGallery',
          ],
          {
            css: true,
          }
        );

      graphicsLayer = new GraphicsLayer();
      await generateCones(now, graphicsLayer, 0.7);

      const map = new Map({
        basemap: 'satellite',
      });
      map.add(graphicsLayer);

      const view = new SceneView({
        container: sceneRef.current,
        map: map,
      });

      setView(view);
      setGraphicsLayer(graphicsLayer);

      let basemapGallery = new BasemapGallery({
        view: view,
      });

      let expand = new Expand({
        view: view,
        content: basemapGallery,
      });
      view.ui.add(expand, 'top-right');

      return () => {
        if (view) {
          // destroy the map view
          view.container = null;
        }
      };
    }
    loadWebScene();
  }, []);

  useEffect(() => {
    if (sceneView) {
      graphicsLayer.removeAll();
      async function recreateCones() {
        await generateCones(globalState.state.date, graphicsLayer, 0.7);
      }
      recreateCones();
    }
  }, [globalState.state.date]);

  return <div style={{ height: '100%', width: '100%' }} ref={sceneRef} />;
};
