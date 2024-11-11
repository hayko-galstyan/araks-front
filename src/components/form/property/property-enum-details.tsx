import { Form } from 'antd';
import { FormItem } from '../form-item';
import { VerticalSpace } from 'components/space/vertical-space';
import { TypeWrapper } from '../type/type-wrapper';
import { COLORS } from 'helpers/constants';
import { Input } from 'components/input';
import styled from 'styled-components';
import { Button } from 'components/button';
import { SecondaryText } from 'components/typography';
import { Rule } from 'antd/es/form';
import { IEnumProperty } from 'types/project-node-types-property';

// #sonarube

const StyledButton = styled(Button)`
  padding: 0;
  height: auto;
  border: 0;

  span {
    text-decoration: underline;
    font-weight: 600;
    font-size: 16px;
  }
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 200px;
  overflow-y: auto;
  border-radius: 4px;
  border: 1px solid #808080;
  background: linear-gradient(92deg, rgba(255, 255, 255, 0.64) 6.81%, rgba(255, 255, 255, 0.16) 100%);
  padding: 1rem;
`;

const validateEnumName = (enums: IEnumProperty[], _field: any) => async (_: Rule, value: string | undefined) => {
  if (!value) return Promise.resolve();

  const regex = /^[a-zA-Z0-9 _]+$/;
  if (!regex.test(value)) {
    return Promise.reject('Name must only contain lowercase letters, numbers, and underscores');
  }

  const existed = enums.some(
    (e, index) => !(_field as { field: string }).field.includes(index.toString()) && e?.name === value,
  );

  if (existed) return Promise.reject('The variant already exists');

  return Promise.resolve();
};

const EnumField = ({ field, enums, remove }: { field: any; enums: IEnumProperty[]; remove: Function }) => (
  <TypeWrapper key={field.name} fieldLength={enums.length} field={field} onRemove={() => remove(field.name)}>
    <FormItem
      style={{ marginBottom: 0 }}
      name={[field.name, 'name']}
      key={field.key}
      rules={[
        { required: true, message: 'Enum name is required' },
        { min: 1, message: 'The minimum length for this field is 1 character' },
        { max: 30, message: 'The maximum length for this field is 30 characters' },
        { validator: validateEnumName(enums, field) },
      ]}
    >
      <Input />
    </FormItem>
  </TypeWrapper>
);

export const PropertyEnumDetails = () => {
  const dataType = Form.useWatch('ref_property_type_id');
  const enums: IEnumProperty[] = Form.useWatch('enums_data');

  return (
    <>
      {dataType === 'enum' && (
        <Form.List name={'enums_data'} initialValue={[null]}>
          {(fields, { add, remove }) => (
            <>
              <Wrapper>
                <FormItem required={dataType} style={{ marginBottom: '0' }}>
                  <VerticalSpace style={{ width: '90%' }}>
                    {fields.map((field) => (
                      <EnumField key={field.name} field={field} enums={enums} remove={remove} />
                    ))}
                  </VerticalSpace>
                </FormItem>
              </Wrapper>

              <StyledButton
                type='link'
                onClick={() => add(null)}
                disabled={fields.length > 14}
                style={{ margin: '0px 10px' }}
              >
                <SecondaryText color={fields.length > 14 ? COLORS.PRIMARY.SILVER : COLORS.PRIMARY.BLUE}>
                  + Add Variant
                </SecondaryText>
              </StyledButton>
              <SecondaryText color={COLORS.PRIMARY.GRAY_DARK}>{fields.length}</SecondaryText>
            </>
          )}
        </Form.List>
      )}
    </>
  );
};
