import './FeaturedImage.css';
import React, { useContext } from 'react';
import Image from 'react-bootstrap/Image';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import ContainerCard from '@components/UI/ContainerCard';
import { Session } from '@client/context/session-context';

export default function FeaturedImage(props) {
  let Featured = null;

  if (props.image) {
    Featured = <Image src={`./images/${props.image.fileName}`} thumbnail />;
  } else {
    Featured = (
      <div className="img-thumbnail mh-100 text-muted text-center d-block">
        Select an image from the grid
      </div>
    );
  }

  return (
    <ContainerCard percentHeight={100} percentWidth={100}
      footer={<FooterButtons/>}>
      <Card className="featured-container w-100 h-100">
        <Card.Body className="w-100 d-flex align-items-center justify-content-center">
          {Featured}
        </Card.Body>
      </Card>
    </ContainerCard>
  );
}

function FooterButtons(props) {
  const { updateSession } = useContext(Session);

  return (
    <div className="footer-buttons">
      <Button variant="success" onClick={() => { updateSession({ sessionId: 0 }); }}>Launch Session</Button>
    </div>
  );
}