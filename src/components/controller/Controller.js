import React, { useEffect, useRef, useState, useContext } from 'react';
import { loadModules } from 'esri-loader';
import { TwitterFollowButton } from 'react-twitter-embed';
import { getTimeExtent } from '../../helpers/helpers';
import { Layout, DatePicker, Row, Col } from 'antd';
import { store } from '../../store/store';
import moment from 'moment';
import './Controller.css';

const { Header, Content, Footer } = Layout;

const onChange = (date, timeSlider, dispatch) => {
  if (date !== null) {
    const { tomorrow, yesterday } = getTimeExtent(date.toDate());
    timeSlider.fullTimeExtent = {
      start: yesterday,
      end: tomorrow,
    };
    timeSlider.timeExtent = {
      start: date.toDate(),
      end: date.toDate(),
    };
    dispatch({ type: 'SET_DATE', data: date.toDate() });
  }
};

const Controller = ({ dispatch, view, now }) => {
  const daylightRef = useRef();
  let [timeSlider, setTimeSlider] = useState(null);
  useEffect(() => {
    // lazy load the required ArcGIS API for JavaScript modules and CSS
    async function loadWidgets() {
      const [TimeSlider] = await loadModules(['esri/widgets/TimeSlider'], {
        css: true,
      });
      const { tomorrow, yesterday } = getTimeExtent(now);

      if (view) {
      }
      timeSlider = new TimeSlider({
        view: view,
        container: daylightRef.current,
        loop: true,
        layout: 'compact',
        mode: 'instant',
        timeVisible: true,
        stops: {
          interval: {
            value: 1,
            unit: 'hours',
          },
        },
        fullTimeExtent: {
          start: yesterday,
          end: tomorrow,
        },
        timeExtent: {
          start: now,
          end: now,
        },
      });

      timeSlider.watch('timeExtent', (timeExtent) => {
        dispatch({ type: 'SET_DATE', data: new Date(timeExtent.start) });
      });
      setTimeSlider(timeSlider);
    }
    loadWidgets();
  }, []);

  return (
    <>
      <Layout>
        <Header className="headerTitle">Day and Night</Header>
        <Layout>
          <Content>
            <div ref={daylightRef}></div>
          </Content>
        </Layout>
        <Footer>
          <Row className="footer">
            <Col
              xs={{ span: 24 }}
              sm={{ span: 24 }}
              md={{ span: 24 }}
              lg={{ span: 12 }}
              xl={{ span: 12 }}
            >
              <DatePicker
                onChange={(date) => onChange(date, timeSlider, dispatch)}
                className="footerContent datePicker"
                defaultValue={moment()}
              />
            </Col>
            <Col
              xs={{ span: 24 }}
              sm={{ span: 24 }}
              md={{ span: 24 }}
              lg={{ span: 12 }}
              xl={{ span: 12 }}
            >
              <div className="footerContent twitterButton">
                <TwitterFollowButton
                  screenName={'ialixandroae'}
                  options={{ showCount: false }}
                />
              </div>
            </Col>
          </Row>
        </Footer>
      </Layout>
    </>
  );
};

export default Controller;
