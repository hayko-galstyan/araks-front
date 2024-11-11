import { TabsProps, Row as RowComponent, Col } from 'antd';
import styled from 'styled-components';
import { useIsXXlScreen } from 'hooks/use-breakpoint';
import { Filters } from '../filters';
import { Styling } from '../styling';
import { StyledDataVisualisationSiderTabs } from './styles';
import { Queries } from '../queries';
import { ReactComponent as CollapseSvg } from './icon/collapse.svg';
import React, { Dispatch, FC, SetStateAction, useState } from 'react';
import { QuerySection } from '../query-section';

type Props = FC<{
  collapsed?: boolean;
  setCollapsed?: Dispatch<SetStateAction<boolean>>;
  queryCollapsed: boolean;
  setQueryCollapsed: Dispatch<SetStateAction<boolean>>;
}>;
const MemoizedStyledDataVisualisationSiderTabs = React.memo(StyledDataVisualisationSiderTabs);

export const Items: TabsProps['items'] = [
  {
    key: '1',
    label: 'Filters',
  },
  {
    key: '2',
    label: 'Queries',
  },
  {
    key: '3',
    label: 'Styling',
  },
];

const Row = styled((props) => <RowComponent {...props} />)`
  &.overview {
    height: 100%;
    width: 100%;
    .ant-col.overview__section {
      &:first-child {
        background: #f2f2f2;
        box-shadow: 10px 0 10px rgba(111, 111, 111, 0.1);
      }
    }

    .overview-form-items {
      min-height: 80vh;
    }
  }
`;

export const StyledCol = styled(Col)`
  position: absolute;
  top: 0;
  left: 0;
  overflow-y: auto;
  transition: width 0.5s ease-in-out;
  overflow-x: hidden;
`;

const CollapseCol = styled(Col)`
  position: absolute;
  width: 40px;
  height: 40px;
  cursor: pointer;
  top: 49%;
  z-index: 3;
  transition: left 0.5s ease-in-out;

  svg {
    transition: 0.5s ease-in-out;
  }
`;

export const LeftSection: Props = ({ collapsed, setCollapsed, queryCollapsed, setQueryCollapsed }) => {
  const isXXL = useIsXXlScreen();

  const sectionStyle = {
    width: '460px',
    transition: `opacity ${collapsed ? '2s' : '0.5s'} ease-in-out`,
    opacity: collapsed ? '1' : '0',
    overflow: collapsed ? 'auto' : 'hidden',
  };
  const qerySectionStyle = {
    width: queryCollapsed ? '320px' : '0px',
    transition: `opacity ${queryCollapsed ? '3s' : '2s'} ease-in-out`,
    opacity: queryCollapsed ? '1' : '0',
    overflow: queryCollapsed ? 'auto' : 'hidden',
  };
  const handleTabChange = () => {
    queryCollapsed && setQueryCollapsed(false);
  };
  const [activeQuerisID, setActiveQuerisID] = useState<{ name: string; id: string } | null>(null);

  return (
    <Row>
      <Row className="overview">
        <StyledCol
          style={{
            width: collapsed ? (queryCollapsed ? '800px' : '480px') : '20px',
            height: `calc(100vh - ${isXXL ? '152px' : '130px'})`,
            display: 'flex',
          }}
          className="overview__section project-save"
          id="datasheet-tree-list"
        >
          <MemoizedStyledDataVisualisationSiderTabs
            style={sectionStyle}
            tabBarGutter={isXXL ? 50 : 30}
            destroyInactiveTabPane
            defaultActiveKey="1"
            onChange={handleTabChange}
            items={Items.map((item) => ({
              ...item,
              children:
                item.key === '1' ? (
                  <Filters height="auto" />
                ) : item.key === '2' ? (
                  <Queries
                    activeQuerisID={activeQuerisID}
                    setActiveQuerisID={setActiveQuerisID}
                    queryCollapsed={queryCollapsed}
                    setQueryCollapsed={setQueryCollapsed}
                  />
                ) : (
                  <Styling />
                ),
            }))}
          />
          <div style={qerySectionStyle}>
            <QuerySection activeQuerisID={activeQuerisID} setActiveQuerisID={setActiveQuerisID} />
          </div>
        </StyledCol>
        <CollapseCol
          style={{ left: collapsed ? (queryCollapsed ? '780px' : '460px') : '0' }}
          onClick={() => {
            queryCollapsed ? setQueryCollapsed(false) : setCollapsed!(!collapsed);
          }}
        >
          <CollapseSvg style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0)' }} />
        </CollapseCol>
      </Row>
    </Row>
  );
};
