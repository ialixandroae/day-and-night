import React, { useEffect, useRef, useContext, useState } from 'react';
import ReactDOM from 'react-dom';
import { loadModules } from 'esri-loader';
import { generateCones } from '../../helpers/helpers';
import { store } from '../../store/store';
import Controller from '../controller/Controller';

export const MapView = () => {
  const globalState = useContext(store);
  const { dispatch } = globalState;

  const mapRef = useRef();
  const [mapView, setView] = useState(null);
  let [graphicsLayer, setGraphicsLayer] = useState(null);

  const now = globalState.state.date;

  useEffect(() => {
    // lazy load the required ArcGIS API for JavaScript modules and CSS
    async function loadWebScene() {
      const [Map, MapView, GraphicsLayer, Expand] = await loadModules(
        [
          'esri/Map',
          'esri/views/MapView',
          'esri/layers/GraphicsLayer',
          'esri/widgets/Expand',
        ],
        {
          css: true,
        }
      );

      graphicsLayer = new GraphicsLayer();

      await generateCones(now, graphicsLayer, 0.3);

      const map = new Map({
        basemap: 'topo-vector',
      });
      map.add(graphicsLayer);

      const view = new MapView({
        container: mapRef.current,
        map: map,
        zoom: 2,
      });

      var node = document.createElement('div');
      ReactDOM.render(
        <Controller dispatch={dispatch} view={view} now={now} />,
        node
      );

      let expand = new Expand({
        view: view,
        content: node,
      });
      view.ui.add(expand, 'top-right');

      setView(view);
      setGraphicsLayer(graphicsLayer);

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
    if (mapView) {
      graphicsLayer.removeAll();
      async function recreateCones() {
        await generateCones(globalState.state.date, graphicsLayer, 0.3);
      }
      recreateCones();
    }
  }, [globalState.state.date]);

  return <div style={{ height: '100%', width: '100%' }} ref={mapRef} />;
};
