import React from 'react';
import { Layout, Row, Col } from 'antd';
import { MapView } from '../map/Map';
import { SceneView } from '../scene/Scene';
import './Main.css';

const { Content } = Layout;

function Main() {
  return (
    <Layout>
      <Content>
        <Row gutter={[0, 0]}>
          <Col
            xs={{ span: 24 }}
            sm={{ span: 24 }}
            md={{ span: 24 }}
            lg={{ span: 12 }}
            xl={{ span: 12 }}
            className="leftCol"
          >
            <MapView />
          </Col>
          <Col
            xs={{ span: 24 }}
            sm={{ span: 24 }}
            md={{ span: 24 }}
            lg={{ span: 12 }}
            xl={{ span: 12 }}
            className="rightCol"
          >
            <SceneView />
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}

export default Main;
