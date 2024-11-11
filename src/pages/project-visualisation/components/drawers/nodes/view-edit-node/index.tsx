/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGraph } from 'components/layouts/components/visualisation/wrapper';
import { groupedData, setNodeDataUpdateValue } from 'pages/data-sheet/components/table-section/node/utils';
import { Drawer } from 'components/drawer/node-drawer/view-node-drawer';
import { Col, Form, Row, Skeleton, UploadFile } from 'antd';
import { NodeViewTitle } from './node-view-title';
import { AddNodeForm } from 'components/form/add-node-form';
import { NodeDataConnectionToSave, ProjectTypePropertyReturnData, UserProjectRole } from 'api/types';
import { useGetProjectNodeTypeProperties } from 'api/project-node-type-property/use-get-project-node-type-properties';
import { useGetNode } from 'api/node/use-get-node';
import {
  NodeBody,
  NodeDataResponse,
  NodeDataSubmit,
  NodePropertiesValues,
  ResponseLocationType,
  UpdateNodeEdges,
  UploadedFileType,
} from 'types/node';
import { PropertyTypes } from 'components/form/property/types';
import dayjs from 'dayjs';
import { Button } from 'components/button';
import { getConnectionFormName } from 'components/form/type/connection-type';
import { useManageNodesGraph } from 'api/visualisation/use-manage-node';
import { setUploadFileStructure } from 'pages/data-sheet/utils';
import { ViewNode } from './node-view';
import { useProject } from 'context/project-context';
import { addEdges, updateConnector } from 'components/layouts/components/visualisation/helpers/utils';
import { ReactComponent as JiraSvg } from 'components/icons/jira.svg';
import { SecondaryText } from 'components/typography';
import { CloseOutlined } from '@ant-design/icons';
import { JiraIssueRequestType } from 'api/jira/use-create-issue';
import { useJira } from 'components/drawer/tool-set/components/jira/context';
import { ToolSetJira } from 'components/drawer/tool-set/components/jira';
import { useLocation } from 'react-router-dom';

export type VIewDataType = NodeDataResponse | undefined;

const getValue = (item: NodePropertiesValues) => {
  switch (item.project_type_property_type) {
    case PropertyTypes.Location:
      return (
        (item.nodes_data as ResponseLocationType[])?.map((addr) => ({
          address: addr.address,
          lat: addr.location.latitude,
          lng: addr.location.longitude,
        })) || []
      );
    case PropertyTypes.DateTime:
    case PropertyTypes.Date:
      return (item.nodes_data || []).map((rec) => dayjs(rec as string));
    case PropertyTypes.IMAGE_URL:
      return (item.nodes_data as string[])?.map((rec, index) => setUploadFileStructure(rec, `Image ${index}`)) || [];
    case PropertyTypes.Document:
      return (item.nodes_data as UploadedFileType[])?.map((rec) => setUploadFileStructure(rec.url, rec.name)) || [];
    default:
      return item.nodes_data || [];
  }
};

export const ViewEditNodeDrawer = () => {
  const { state } = useLocation();
  const [form] = Form.useForm();
  const [selectedView, setSelectedView] = useState<VIewDataType>();

  const { graph, openNode, finishOpenNode, startOpenNode } = useGraph() ?? {};
  const { projectInfo } = useProject();
  const { setNodeId, setResetOpenViews } = useJira();

  const [isEdit, setIsEdit] = useState(false);
  const [isJira, setIsJira] = useState(false);

  const setFormValue = useCallback(
    (data: NodeDataResponse | undefined) => {
      const initialAcc = {
        name: [data?.name],
        default_image: [setUploadFileStructure(data?.default_image ?? '', 'Default image')],
      };

      const fieldsData = data?.properties?.reduce((acc, item) => {
        if (!item.nodes_data?.length) {
          return acc;
        }

        return {
          ...acc,
          [item.nodeTypeProperty.name]: getValue(item),
        } as NodePropertiesValues;
      }, initialAcc);

      const groupListEdges = groupedData(data?.edges ?? []);

      const connectionFieldsData = Object.entries(groupListEdges).reduce((acc, [key, item]) => {
        return {
          ...acc,
          [key]: item.map((row) => ({
            rowId: row.id,
            id: row.edgeTypes.id,
            name: row.source.id === openNode.id ? row.target.name : row.source.name,
            source_id: row.source_id,
            source_type_id: row.source_type_id,
            target_id: row.target_id,
            target_type_id: row.target_type_id,
          })),
        };
      }, {});

      form.setFieldsValue({
        ...fieldsData,
        name: [data?.name],
        default_image: [setUploadFileStructure(data?.default_image ?? '', 'Default image')],
        ...connectionFieldsData,
      });
    },
    [form, openNode?.id]
  );

  const { data: nodeData } = useGetNode(openNode?.id ?? '', {
    enabled: !!openNode?.id,
    onSuccess: (data) => {
      setFormValue(data);
      setSelectedView(data);
    },
  });

  const { isInitialLoading, data: properties } = useGetProjectNodeTypeProperties(nodeData?.project_type_id, {
    enabled: !!nodeData?.project_type_id,
  });

  const { mutate, isLoading } = useManageNodesGraph({
    onSuccess: ({ data, variables }) => {
      const { nodeId } = variables;
      if (graph.getNodes().find((n) => n.getID() === nodeId)) {
        const { destroyedEdges, createdEdges } = data as UpdateNodeEdges;

        updateNode(variables);

        destroyedEdges?.forEach((e) => graph.removeItem(e.id));

        addEdges(graph, nodeId ?? '', createdEdges);

        updateConnector(graph);

        onClose();
      }
    },
  });

  const updateNode = useCallback(
    (variable: NodeDataSubmit) => {
      const splitName = variable.name.length > 15 ? `${variable.name.slice(0, 15)}...` : variable.name;
      graph.updateItem(variable.nodeId ?? '', {
        label: splitName,
        originalName: variable.name,
        type: variable.default_image ? 'image' : 'circle',
        img: variable.default_image ? `${process.env.REACT_APP_AWS_URL}${variable.default_image}?key=${Date.now()}` : undefined,
        edgeCount: variable.edges?.length,
      });
    },
    [graph]
  );

  const onClose = useCallback(() => {
    setIsEdit(false);
    setIsJira(false);
    finishOpenNode();
    setResetOpenViews();
  }, [finishOpenNode]);

  const handleBackToolSetJira = useCallback(() => {
    setIsJira((prev) => !prev);
    setResetOpenViews();
  }, [setIsJira]);

  const onFinish = useCallback(
    (values: NodeBody | JiraIssueRequestType) => {
      const formValues = values as NodeBody;

      const mainData = {
        name: (formValues.name as string[]).join(''),
        default_image:
          formValues.default_image && (formValues.default_image as [])?.length > 0
            ? (formValues.default_image as UploadFile[])[0].response.data.uploadPath
            : '',
      };

      const dataToSubmit = nodeData?.properties
        ?.map((item) => {
          return item.project_type_property_type !== PropertyTypes.Connection
            ? {
                id: item.id,
                project_type_property_id: item.project_type_property_id,
                project_type_property_type: item.project_type_property_type,
                nodes_data: setNodeDataUpdateValue(item, formValues),
              }
            : null;
        })
        .filter(Boolean);

      const dataToSubmitEdges = properties
        ?.map((item) => {
          const formName = getConnectionFormName(item.name, item.id);
          return item.ref_property_type_id === PropertyTypes.Connection
            ? (formValues[formName] as NodeDataConnectionToSave[])?.map((itemConn) => ({
                id: itemConn.rowId,
                source_id: itemConn.source_id,
                source_type_id: itemConn.source_type_id,
                target_id: itemConn.target_id,
                target_type_id: itemConn.target_type_id,
                project_edge_type_id: itemConn.id,
              }))
            : null;
        })
        .filter(Boolean);

      if (nodeData?.id) {
        mutate({
          ...mainData,
          nodes: dataToSubmit,
          edges: dataToSubmitEdges?.flat() || [],
          project_type_id: nodeData?.project_type_id || '',
          nodeId: nodeData.id,
          destroyedEdgesIds: form.getFieldValue('destroyedEdgesIds'),
        } as NodeDataSubmit);
      }
    },
    [form, mutate, nodeData, properties]
  );

  const footer = useMemo(
    () =>
      isEdit && (
        <Row gutter={16} justify="center">
          <Col span={4}>
            <Button style={{ marginRight: 8 }} onClick={() => setIsEdit(false)} block>
              Cancel
            </Button>
          </Col>
          <Col span={4}>
            <Button type="primary" onClick={() => form.submit()} loading={isLoading} disabled={isLoading} block>
              Save
            </Button>
          </Col>
        </Row>
      ),
    [isEdit, isLoading, form]
  );

  const canEdit = projectInfo?.role === UserProjectRole.Owner || projectInfo?.role === UserProjectRole.Editor;

  useEffect(() => {
    if (nodeData) {
      setFormValue(nodeData);
    }
    if (openNode?.id) {
      setNodeId(openNode?.id);
    }
    return () => form.resetFields();
  }, [form, nodeData, setFormValue]);
  useEffect(()=>{
    if(state && state.autoCommentsIsOpen){
      startOpenNode({ id: state.node_id, isOpened: true, autoCommentsIsOpen: true });
    }
  },[state])

  const jiraTitle = (
    <Row>
      <Col>
        <JiraSvg />
      </Col>
      <Col offset={1}>
        <SecondaryText style={{ color: '#253858', fontSize: 18 }}>Jira</SecondaryText>
      </Col>
      <Col offset={19}>
        <CloseOutlined
          className="cancel-btn"
          onClick={() => {
            setIsJira(false);
          }}
        />
      </Col>
    </Row>
  );

  const editForm = (
    <Form
      form={form}
      name="node-edit-form"
      autoComplete="off"
      layout="vertical"
      requiredMark={false}
      onFinish={onFinish}
    >
      <AddNodeForm
        nodeId={openNode?.id}
        nodeTypeId={nodeData?.project_type_id}
        data={properties as ProjectTypePropertyReturnData[]}
        isInitialLoading={isInitialLoading}
        edges={nodeData?.edges?.concat(nodeData?.edges_in)}
        property={nodeData?.properties?.find((p) => p.node_id === openNode.id)}
      />
    </Form>
  );

  const renderContent = () => {
    if (isEdit) return editForm;
    if (isJira) return <ToolSetJira defaultTypeView="task" handleBackClick={handleBackToolSetJira} />;
    if (isInitialLoading) return <Skeleton />;
    return <ViewNode selectedView={selectedView} properties={nodeData?.properties} />;
  };

  return (
    <Drawer
    open={openNode?.isOpened}
      headerStyle={{
        borderTop: `6px solid ${nodeData?.nodeType?.color}`,
      }}
      closable={false}
      onClose={onClose}
      title={
        isJira ? (
          jiraTitle
        ) : (
          <>
            <NodeViewTitle
              isJira={!nodeData?.jiraConnectProject}
              setIsJira={setIsJira}
              setIsEdit={setIsEdit}
              isEdit={isEdit}
              id={nodeData?.id as string}
              name={nodeData?.nodeType?.name ?? ''}
              onClose={onClose}
              canEdit={canEdit}
              parentDrawerClosed={openNode?.isOpened ? openNode.isOpened : false}
            />
          </>
        )
      }
      footer={footer}
    >
      {renderContent()}
    </Drawer>
  );
};