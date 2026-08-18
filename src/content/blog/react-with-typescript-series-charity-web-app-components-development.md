---
title: "React with Typescript series (Charity Web App) — Components Development"
date: "2022-08-13"
preview: "Hi Guys, So in this React with typescript series, so far we have created the initial app and then in the last tutorial we created some…"
description: "Building the React and TypeScript components for the charity web app from the wireframes designed in the previous tutorial."
tags: ["react", "nodejs", "devops"]
mediumUrl: "https://medium.com/@billacode/react-with-typescript-series-charity-web-app-components-development-777632dfda70"
---
Hi Guys, So in this React with typescript series, so far we have created the initial app and then in the last tutorial we created some wire-frame designs for the UI.

In this tutorial we will see how to implement those designs by creating reusable components.

So as we discuss in our last tutorial we have to create a DataTableComponent and then 2 modal components for Student and Sponsor details. Other than these we need a navigation bar as well. As the first step we will create the DataTableComponent.

To create the DataTableComponent I’m using react-data-grid library, install it using “npm i react-grid” command. This library has so many cool features and easy to get start on. I will create a new file called DataTableComponent.tsx in src/components/DataTableComponent folder like this.

```typescript
import React, { Component } from 'react';
import DataGrid from 'react-data-grid';

interface DataTableProps {
    columns: columnType[],
    rows: rowType[]
}

type columnType = {
    key: string;
    name: string;
};

type rowType = {
    id: number;
    name: string;
};
  
export default class DataTableComponent extends Component<DataTableProps> {
    constructor(props: DataTableProps) {
        super(props);
    }

    render(): React.ReactNode {
        return <DataGrid style={{height: '100vh'}} columns={this.props.columns} rows={this.props.rows} />;
    }
}
```

Now let’s try to understand what we have written here. So the DataTableComponent is created by extending React Component which gives us access to constructor and all other life cycle methods. If we did this as functions then we can use hooks to do our work but in this particular tutorial series I’m using Components only (Mainly because there are less tutorials like this).

As we are using typescript we have to define types for each of the variable we use in this code. So I have defined types for columnType and rowType and then I have defined an interface to use as the props type for the component. Instead I can always use type “any” in our code, but this is more professional and correct. So the table component is ok. Now let’s write an unit test to check whether it renders or not. I will create another file called DataTableComponent.test.tsx in the same folder like this.

```typescript
import { render } from "@testing-library/react";
import React from "react";
import { describe, it, expect } from "@jest/globals";
import DataTableComponent from "./DataTableComponent";

describe("Card", () => {
  it("renders", () => {
    const wrapper = render(<DataTableComponent columns={[]} rows={[]} />);
    expect(wrapper.container).toMatchSnapshot();
  });
});
```

Here we render the component and check whether it’s automatically created snapshot is same as the current implementation. This is very valuable when we add later changes to the app because always we can detect if something is changed.

Now let’s create the Modal popup for student details. Before doing this we have to install react-boostrap, in the command line type “npm i react-bootstrap”. We are going to implement this in a way that user can open the popup from a button in table row. First let’s code the StudentModalComponent. I will create this file in src/components/StudentModalComponent folder like this.

```typescript
import React, { Component } from 'react';
import { Modal, Button } from 'react-bootstrap';

interface ModalPropType {
    show: boolean,
    studentid: string,
    onHide(): void
}

export default class StudentModalComponent extends Component<ModalPropType> {
    constructor(props: ModalPropType) {
        super(props);
    }

    render(): React.ReactNode {
        return <Modal {...this.props}>
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                    Details of Student {this.props.studentId}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>

            </Modal.Body>
            <Modal.Footer>
                <Button onClick={this.props.onHide}>Save</Button>
                <Button onClick={this.props.onHide}>Delete</Button>
                <Button onClick={this.props.onHide}>Close</Button>
            </Modal.Footer>
        </Modal>
    }
}
```

Now if we go through what I have done here, I’m simply creating a modal using react-boostrap library. So you should wonder how the all show and hide works. We will handle it using react state from the next component and the method for handling this will be send through a prop. So that’s why we have onHide() and show as our props. The prop “show” will be used in Modal component from this line {…this.props}. “onhide()” will be used to close the modal. Now lets write our unit tests for this as well.

```typescript
import { render } from "@testing-library/react";
import React from "react";
import { describe, it, expect } from "@jest/globals";
import StudentModalComponent from "./StudentModalComponent";

describe("StudentModalComponent", () => {
  it("renders", () => {
    const wrapper = render(<StudentModalComponent show={true} studentid={"1"} onHide={jest.fn()} />);
    expect(wrapper.container).toMatchSnapshot();
  });

  it("not renders", () => {
    const wrapper = render(<StudentModalComponent show={false} studentid={"1"} onHide={jest.fn()} />);
    expect(wrapper.container).toMatchSnapshot();
  });
});
```

Now let’s create the button component to handle the show hide of Student Modal. I will create this file in the src/components/StudentModalButton folder.

```typescript
import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import StudentModalComponent from '../StudentModalComponent/StudentModalComponent';

interface StudentModalButtonComponentProps {
    studentId: string
}

export default class StudentModalButton extends Component<StudentModalButtonComponentProps, { show: boolean }> {
    constructor(props: StudentModalButtonComponentProps) {
        super(props);

        this.state = {
            show: false
        };
    }

    setModalShow(showState: boolean) {
        this.setState({ show: showState });
    }

    render(): React.ReactNode {
        return <>
            <Button onClick={() => this.setModalShow(true)}>{this.props.studentId}</Button>
            <StudentModalComponent show={this.state.show} onHide={() => this.setModalShow(false)} studentid = {this.props.studentId} />
        </>
    }
}
```

Here what we have done is we are keeping a state called show and send it to StudentModalComponent to show and hide it. Now let’s write the unit test for this as well.

```typescript
import { render } from "@testing-library/react";
import React from "react";
import { describe, it, expect } from "@jest/globals";
import StudentModalButton from "./StudentModalButton";

describe("Card", () => {
  it("renders", () => {
    const wrapper = render(<StudentModalButton studentId={"1"} />);
    expect(wrapper.container).toMatchSnapshot();
  });
});
```

Now we will create the StudentTableComponent using the component by using the DataTableComponent and ModalButton component created above. For this I will create a file called StudentTableComponent.tsx inside src/components/StudentTableComponent like this.

```typescript
import React, { Component } from 'react';
import DataTableComponent from '../../components/DataTableComponent/DataTableComponent';
import ModalButtonComponent from '../../components/ModalButtonCompnent';

const columns = [
    {
        key: 'id', name: 'ID', width: 10,
        formatter(props: any) {
            return (
                <>
                    <ModalButtonComponent studentId={props.row.id} />
                </>
            );
        },
    },
    { key: 'name', name: 'Name' },
    { key: 'contactNo', name: 'Contact No' },
    { key: 'email', name: 'Email' },
    { key: 'university', name: 'Univeristy' },
    { key: 'course', name: 'Course of Study' },
    { key: 'startDate', name: 'Course Start Date' },
    { key: 'endDate', name: 'Course End Date' },
    { key: 'scholEndDate', name: 'Schol. start Date' },
    { key: 'sponsor', name: 'Sponsor Name' }
];

const rows = [
    { id: 0, name: 'Example' },
    { id: 1, name: 'Demo' }
];

export default class StudentTableComponent extends Component {
    render(): React.ReactNode {
        return <DataTableComponent columns={columns} rows={rows} />;
    }
}
```

Here I have use some dummy data for the rows but after we implement backend these will be changed to get data from backend. Now we can test this component as well let’s write the StudentTableComponent.test.tsx file.

```typescript
import { render } from "@testing-library/react";
import React from "react";
import { describe, it, expect } from "@jest/globals";
import StudentTableComponent from "./StudentTableComponent";

describe("StudentTableComponent", () => {
  it("renders", () => {
    const wrapper = render(<StudentTableComponent />);
    expect(wrapper.container).toMatchSnapshot();
  });
});
```

Now we have almost completed developing student components and unit tests related to that. Now let’ create the LandingContainer.tsx in the src/containers/LandingContainer folder.

```typescript
import React, { Component } from 'react';
import StudentTableComponent from '../../components/StudentTableComponent/StudentTableComponent';
import { Navbar, Container, Nav, Button, Tab, Col, Row } from 'react-bootstrap';

interface LandingContainerProp { }

const btn = { backgroundColor: '#212529' };

export default class LandingContainer extends Component<LandingContainerProp> {
    constructor(props: LandingContainerProp) {
        super(props);
    }

    render(): React.ReactNode {
        return <>
            <Navbar bg="dark" variant="dark">
                <Container fluid>
                    <Navbar.Brand>Serendib Foundation</Navbar.Brand>
                </Container>
            </Navbar>
            <Container style={btn} fluid>
                <Tab.Container id="left-tabs-example" defaultActiveKey="first">
                    <Row style={btn}>
                        <Col sm={1}>
                            <Nav variant="pills" className="flex-column">
                                <Nav.Item>
                                    <Nav.Link eventKey="first">Student</Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="second">Sponsors</Nav.Link>
                                </Nav.Item>
                            </Nav>
                        </Col>
                        <Col sm={11}>
                            <Tab.Content>
                                <Tab.Pane eventKey="first">
                                    <StudentTableComponent />
                                </Tab.Pane>
                                <Tab.Pane eventKey="second">
                                    <StudentTableComponent />
                                </Tab.Pane>
                            </Tab.Content>
                        </Col>
                    </Row>
                </Tab.Container>
            </Container>
        </>
    }
}
```

This code will create the cool bootstrap Nav components to give the exact look we planned in the previous tutorial. After that we have include our StudentTableComponent in to this. Now let’s write the unit test for this.

```typescript
import { render } from "@testing-library/react";
import React from "react";
import { describe, it, expect } from "@jest/globals";
import LandingContainer from "./LandingContainer";

describe("LandingContainer", () => {
  it("renders", () => {
    const wrapper = render(<LandingContainer />);
    expect(wrapper.container).toMatchSnapshot();
  });
});
```

Now what we have to do is add this container to App.tsx file like this.

```typescript
import LandingContainer from "./containers/LandingContainer/LandingContainer";

export default function App() {
  return (
    <LandingContainer />
  );
}
```

And update the App.test.tsx file

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/Serendib Foundation/i);
  expect(linkElement).toBeInTheDocument();
});
```

For this step all is good now. We have a working prototype of what we designed. Let’s meet in the next tutorial to learn mode intersting concepts. To create SponsorTable and related components try the same way as we did now. Happy coding :D!!!!

Note: Code is here [https://github.com/deBilla/serendib-scholarship-ui](https://github.com/deBilla/serendib-scholarship-ui)
