import { AppShell } from './components/layouts/AppShell'
import { SidePanel } from './components/features/SidePanel/SidePanel'
import { StockGrid } from './components/features/StockGrid/StockGrid'
import { GridProvider } from './components/features/StockGrid/GridContext'
import styles from './App.module.css'

export default function App() {
  return (
    <div className={styles.app}>
      <GridProvider>
        <AppShell sidebar={<SidePanel />}>
          <StockGrid />
        </AppShell>
      </GridProvider>
    </div>
  )
}
