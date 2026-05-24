import React from 'react';
import { FlatList, StyleSheet } from 'react-native';

interface Props<T> {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: ({ item }: { item: T }) => React.ReactElement;
  numColumns?: number;
  onEndReached?: () => void;
}

export default function ContentGrid<T>({ data, keyExtractor, renderItem, numColumns = 3, onEndReached }: Props<T>) {
  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      numColumns={numColumns}
      contentContainerStyle={styles.container}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 8 },
});
