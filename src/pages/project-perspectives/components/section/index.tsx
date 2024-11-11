import { Header } from './header';
import { Collapse } from './collapse';
import { useGetPerspectives } from 'api/perspective/use-get-perspectives';
import { useMemo } from 'react';
import { Wrapper } from './style';
import { Share } from './share';
import { useIsXXlScreen } from 'hooks/use-breakpoint';

export const Section = () => {
  const isXXl = useIsXXlScreen();

  const { data } = useGetPerspectives();

  const panels = useMemo(() => (data?.length ? data : []), [data]);

  return (
    <Wrapper style={{ width: isXXl ? '600px' : '400px', top: isXXl ? '152px' : '130px' }}>
      <Header />
      <Collapse panels={panels} />
      <Share />
    </Wrapper>
  );
};