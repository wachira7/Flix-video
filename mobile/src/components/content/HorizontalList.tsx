import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

interface Props<T> {
  title: string;
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: ({ item }: { item: T }) => React.ReactElement;
}

export default function HorizontalList<T>({ title, data, keyExtractor, renderItem }: Props<T>) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12, paddingHorizontal: 16 },
  list: { paddingHorizontal: 16 },
});
