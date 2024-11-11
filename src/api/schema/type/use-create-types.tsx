import { RequestTypes } from 'api/types';
import { useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { ProjectNodeTypeResponse, ProjectNodeTypeSubmit } from 'types/project-node-types';

import client from '../../client';
import { GET_TYPES } from './use-get-types';
import { errorMessage } from 'helpers/utils';
import { GET_EDGES } from '../edge/use-get-edges';
import { GET_TEMPLATE } from '../../project-templates/use-get-template-by-id';
import { useIsTemplateEditPage } from 'hooks/use-is-template-page';
import { useSchema } from 'components/layouts/components/schema/wrapper';

const URL_PROJECT_NODE_TYPES_CREATE = '/projects-node-types/create';
const URL_PROJECT_NODE_TYPES_UPDATE = '/projects-node-types/update/:id';

const URL_TEMPLATE_NODE_TYPES_CREATE = 'templates/node-type';
const URL_TEMPLATE_NODE_TYPES_UPDATE = 'templates/node-type/:id';

type ReturnData = {
  data: ProjectNodeTypeResponse;
};

type QueryResponse = {
  data: ReturnData;
};

type Options = UseQueryOptions<QueryResponse, Error, ReturnData>;

export const useCreateType = (options: Options, nodeTypeId?: string) => {
  const params = useParams();
  const { template_preview_data } = useSchema() ?? {};
  const isTemplateEditPage = useIsTemplateEditPage();

  const url = nodeTypeId
    ? URL_PROJECT_NODE_TYPES_UPDATE.replace(':id', nodeTypeId || '')
    : URL_PROJECT_NODE_TYPES_CREATE;

  const urlTemplate = nodeTypeId
    ? URL_TEMPLATE_NODE_TYPES_UPDATE.replace(':id', nodeTypeId || '')
    : URL_TEMPLATE_NODE_TYPES_CREATE;

  const queryClient = useQueryClient();

  const mutation = useMutation<ReturnData, unknown, ProjectNodeTypeSubmit>({
    mutationFn: ({ parent_id, ...values }: ProjectNodeTypeSubmit) => {
      const type = nodeTypeId ? RequestTypes.Put : RequestTypes.Post;
      const body = nodeTypeId
        ? { ...values, ...{ parent_id: parent_id || null } }
        : { ...values, project_id: params.id, parent_id };

      const { project_id, ...templateParams } = body;

      return client[type](
        isTemplateEditPage ? urlTemplate : url,
        isTemplateEditPage ? { template_id: template_preview_data?.id ?? params.id, ...templateParams } : body
      );
    },
    onSuccess: (data, variables, context) => {
      if (data.data.template_id) {
        queryClient.invalidateQueries([GET_TEMPLATE.replace(':id', data.data.template_id)]);
      } else {
        queryClient.invalidateQueries([GET_TYPES.replace(':project_id', params.id || '')]);
        queryClient.invalidateQueries([GET_EDGES.replace(':project_id', params.id || '')]);
      }

      options?.onSuccess?.(data);
    },
    onError: errorMessage,
  });
  return mutation;
};
