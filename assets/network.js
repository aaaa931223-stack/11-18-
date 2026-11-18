
(() => {
  const data = JSON.parse(document.getElementById('network-data').textContent);
  const metricSelect = document.getElementById('metric-select');
  const metricTitle = document.getElementById('metric-title');
  const infoBox = document.getElementById('selected-info');
  const names = {
    degree: 'Degree Centrality',
    betweenness: 'Betweenness Centrality',
    eigenvector: 'Eigenvector Centrality'
  };
  const originalNodes = data.nodes;
  const rawValues = (metric) => originalNodes.map(node => Number(node[metric]) || 0);

  function nodeSize(node, metric) {
    const values = rawValues(metric);
    const low = Math.min(...values);
    const high = Math.max(...values);
    const normalized = high === low ? 0.5 : (node[metric] - low) / (high - low);
    return 14 + normalized * 34;
  }

  // 對應黑底，將標籤字體預設設定為白色 font: {color: '#ffffff'}
  const nodes = new vis.DataSet(originalNodes.map(node => ({
    ...node,
    size: nodeSize(node, 'degree'),
    color: {
      background: '#4d91c5',
      border: '#27658f',
      highlight: { background: '#dd9858', border: '#af6826' }
    },
    font: { size: 15, color: '#ffffff' },
    title: `${node.label}\nDegree: ${node.degree.toFixed(3)}\nBetweenness: ${node.betweenness.toFixed(3)}\nEigenvector: ${node.eigenvector.toFixed(3)}` 
  })));
  
  const edges = new vis.DataSet(data.edges.map(edge => ({
    ...edge,
    color: { color: 'rgba(255,255,255,0.25)', highlight: '#dd9858', hover: '#dd9858' },
    width: 1.4
  })));
  
  const container = document.getElementById('network');
  const network = new vis.Network(container, { nodes, edges }, {
    autoResize: true,
    physics: false,
    interaction: { dragNodes: true, dragView: true, zoomView: true, hover: true },
    nodes: { shape: 'dot', borderWidth: 1.5 }
  });

  function displaySelection(nodeId) {
    const node = originalNodes.find(n => n.id === nodeId);
    if (!node) {
      infoBox.textContent = '點選節點可以查看其分數。';
      return;
    }
    const val = Number(node[metricSelect.value]).toFixed(3);
    infoBox.textContent = `${node.label}｜${names[metricSelect.value]}：${val}`;
  }

  metricSelect.addEventListener('change', () => {
    const metric = metricSelect.value;
    metricTitle.textContent = names[metric];
    nodes.update(originalNodes.map(node => ({
      id: node.id,
      size: nodeSize(node, metric)
    })));
    const selected = network.getSelectedNodes();
    if (selected.length) displaySelection(selected[0]);
  });

  // 實現：點選節點時，只保留該節點與鄰居，其餘隱藏（淡出）
  network.on('selectNode', params => {
    const selectedId = params.nodes[0];
    displaySelection(selectedId);

    const connectedNodes = network.getConnectedNodes(selectedId);
    const keepNodes = new Set(connectedNodes.map(id => String(id)));
    keepNodes.add(String(selectedId));

    // 更新所有節點透明度與外觀
    nodes.update(originalNodes.map(node => {
      const isConnected = keepNodes.has(node.id);
      return {
        id: node.id,
        color: {
          background: isConnected ? '#4d91c5' : 'rgba(77, 145, 197, 0.15)',
          border: isConnected ? '#27658f' : 'rgba(39, 101, 143, 0.15)'
        },
        font: { color: isConnected ? '#ffffff' : 'rgba(255,255,255,0.15)' }
      };
    }));

    // 更新所有連線透明度
    edges.update(data.edges.map(edge => {
      const isConnected = (edge.from === selectedId || edge.to === selectedId);
      return {
        id: edge.id,
        color: { color: isConnected ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.03)' }
      };
    }));
  });

  // 取消選取或點選空白處時，恢復全網絡顯示
  network.on('deselectNode', () => {
    displaySelection(null);
    nodes.update(originalNodes.map(node => ({
      id: node.id,
      color: {
        background: '#4d91c5',
        border: '#27658f'
      },
      font: { color: '#ffffff' }
    })));
    edges.update(data.edges.map(edge => ({
      id: edge.id,
      color: { color: 'rgba(255,255,255,0.25)' }
    })));
  });
})();
